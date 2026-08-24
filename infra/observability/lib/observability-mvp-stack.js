import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import * as cdk from 'aws-cdk-lib'
import {
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_amplify as amplify,
  aws_cognito as cognito,
  aws_cloudwatch as cloudwatch,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_nodejs as nodejs,
  aws_logs as logs,
  aws_s3 as s3,
  aws_wafv2 as wafv2,
} from 'aws-cdk-lib'

const { Duration, RemovalPolicy, Stack, Tags } = cdk
const repositoryDirectory = resolve(fileURLToPath(new URL('../..', import.meta.url)), '..')
const resourcePrefix = 'oro-observability'
// This GitHub organization emits its OIDC subject with immutable owner and
// repository IDs. CloudTrail is the source of truth for this exact value.
const githubOidcSubject = 'repo:tripleten-externships@196565056/oro_team2@1315215016:environment:oro-production'

function lambdaEntry(name) {
  return resolve(repositoryDirectory, 'infra/observability/lambda', name)
}

function viewerSecurityHeaders(scope, id, name, includeContentSecurityPolicy = false) {
  return new cloudfront.ResponseHeadersPolicy(scope, id, {
    comment: 'Security headers for ORO observability responses',
    responseHeadersPolicyName: name,
    securityHeadersBehavior: {
      ...(includeContentSecurityPolicy ? {
        contentSecurityPolicy: {
          contentSecurityPolicy: "default-src 'self'; img-src 'self' data:; connect-src 'self' https://*.amazoncognito.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://*.amazoncognito.com",
          override: true,
        },
      } : {}),
      contentTypeOptions: { override: true },
      frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
      referrerPolicy: {
        override: true,
        referrerPolicy: cloudfront.HeadersReferrerPolicy.SAME_ORIGIN,
      },
      strictTransportSecurity: {
        accessControlMaxAge: Duration.days(365),
        includeSubdomains: true,
        override: true,
        preload: true,
      },
    },
  })
}

class ObservabilityMvpStack extends Stack {
  constructor(scope, id, props = {}) {
    super(scope, id, props)

    Tags.of(this).add('Environment', 'portfolio')
    Tags.of(this).add('ManagedBy', 'cdk')
    Tags.of(this).add('Name', 'oro-observability')
    Tags.of(this).add('Project', 'oro-observability')

    const account = Stack.of(this).account
    const region = Stack.of(this).region
    const bucketSuffix = `${account}-${region}`

    const cognitoDomainPrefixParameter = new cdk.CfnParameter(this, 'CognitoDomainPrefix', {
      default: props.cognitoDomainPrefix,
      description: 'Globally unique Cognito Hosted UI domain prefix.',
      type: 'String',
    })
    const adminRedirectUriParameter = new cdk.CfnParameter(this, 'AdminRedirectUri', {
      default: props.adminRedirectUri || 'https://bootstrap.invalid/oro-admin/',
      description: 'Full HTTPS redirect URI for the admin SPA, including /oro-admin/. The bootstrap value is replaced with CloudFront after the first deploy.',
      type: 'String',
    })

    const eventsTable = new dynamodb.Table(this, 'EventsTable', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.RETAIN,
      tableName: `${resourcePrefix}-events`,
      timeToLiveAttribute: 'expiresAt',
    })
    eventsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    })

    const adminAssetsBucket = new s3.Bucket(this, 'AdminAssetsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName: `${resourcePrefix}-admin-assets-${bucketSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
    })
    const exportBucket = new s3.Bucket(this, 'ExportBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName: `${resourcePrefix}-exports-${bucketSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [{ expiration: Duration.days(1), prefix: 'exports/' }],
      removalPolicy: RemovalPolicy.RETAIN,
    })

    const homeownerApp = new amplify.CfnApp(this, 'HomeownerApp', {
      // Explicitly clear stale rewrite rules. An omitted CloudFormation property
      // retains the existing Amplify setting on update.
      customRules: [],
      description: 'Manual-deploy Amplify Hosting origin for the public ORO homeowner application.',
      enableBranchAutoDeletion: false,
      name: 'oro-homeowner',
      platform: 'WEB',
    })
    const homeownerBranch = new amplify.CfnBranch(this, 'HomeownerBranch', {
      appId: homeownerApp.attrAppId,
      branchName: 'main',
      description: 'Production branch for the public ORO homeowner application.',
      enableAutoBuild: false,
      enablePerformanceMode: false,
      stage: 'PRODUCTION',
    })
    const amplifyOriginDomain = cdk.Fn.join('.', [
      homeownerBranch.attrBranchName,
      homeownerApp.attrDefaultDomain,
    ])

    const userPool = new cognito.UserPool(this, 'AdminUserPool', {
      accountRecovery: cognito.AccountRecovery.NONE,
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        otp: true,
        sms: false,
      },
      passwordPolicy: {
        minLength: 14,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true,
        requireUppercase: true,
      },
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      userPoolName: `${resourcePrefix}-admin-user-pool`,
      removalPolicy: RemovalPolicy.RETAIN,
    })
    const userPoolDomain = userPool.addDomain('HostedUiDomain', {
      cognitoDomain: { domainPrefix: cognitoDomainPrefixParameter.valueAsString },
    })
    new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      groupName: 'oro-admin',
      userPoolId: userPool.userPoolId,
    })

    const ingestLogGroup = new logs.LogGroup(this, 'IngestLogGroup', {
      logGroupName: `/aws/lambda/${resourcePrefix}-ingest`,
      removalPolicy: RemovalPolicy.RETAIN,
      retention: logs.RetentionDays.TWO_WEEKS,
    })
    const adminLogGroup = new logs.LogGroup(this, 'AdminLogGroup', {
      logGroupName: `/aws/lambda/${resourcePrefix}-admin`,
      removalPolicy: RemovalPolicy.RETAIN,
      retention: logs.RetentionDays.TWO_WEEKS,
    })
    const ingestRole = new iam.Role(this, 'IngestRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Least-privilege runtime role for ORO observability ingestion.',
      roleName: `${resourcePrefix}-ingest-role`,
    })
    const adminRole = new iam.Role(this, 'AdminRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Least-privilege runtime role for ORO observability administration.',
      roleName: `${resourcePrefix}-admin-role`,
    })
    ingestLogGroup.grantWrite(ingestRole)
    adminLogGroup.grantWrite(adminRole)

    const ingestFunction = new nodejs.NodejsFunction(this, 'IngestFunction', {
      entry: lambdaEntry('ingest.js'),
      environment: {
        EVENTS_TABLE_NAME: eventsTable.tableName,
      },
      functionName: `${resourcePrefix}-ingest`,
      logGroup: ingestLogGroup,
      memorySize: 256,
      role: ingestRole,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
    })
    const ingestUrl = ingestFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM,
    })

    const adminClient = userPool.addClient('AdminSpaClient', {
      accessTokenValidity: Duration.minutes(60),
      authFlows: { userSrp: true },
      generateSecret: false,
      oAuth: {
        callbackUrls: [adminRedirectUriParameter.valueAsString],
        flows: { authorizationCodeGrant: true },
        logoutUrls: [adminRedirectUriParameter.valueAsString],
        scopes: [cognito.OAuthScope.OPENID],
      },
    })
    const adminFunction = new nodejs.NodejsFunction(this, 'AdminFunction', {
      entry: lambdaEntry('admin-api.js'),
      environment: {
        COGNITO_CLIENT_ID: adminClient.userPoolClientId,
        COGNITO_ISSUER: `https://cognito-idp.${region}.amazonaws.com/${userPool.userPoolId}`,
        EVENTS_TABLE_NAME: eventsTable.tableName,
        EXPORT_BUCKET_NAME: exportBucket.bucketName,
      },
      functionName: `${resourcePrefix}-admin`,
      logGroup: adminLogGroup,
      memorySize: 512,
      role: adminRole,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
    })
    const adminUrl = adminFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM,
    })

    eventsTable.grant(ingestRole, 'dynamodb:PutItem')
    eventsTable.grant(adminRole, 'dynamodb:Query')
    adminRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [exportBucket.arnForObjects('exports/*')],
      sid: 'CreateAndSignScopedExports',
    }))

    const lambdaOac = new cloudfront.FunctionUrlOriginAccessControl(this, 'LambdaOac', {
      originAccessControlName: 'oro-observability-lambda-oac',
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    })
    const adminPathFunction = new cloudfront.Function(this, 'AdminPathRewrite', {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri === '/oro-admin' || uri === '/oro-admin/') {
    request.uri = '/index.html';
  } else if (uri.indexOf('/oro-admin/') === 0) {
    request.uri = uri.substring('/oro-admin'.length);
  }
  return request;
}
      `),
      functionName: `${resourcePrefix}-admin-path-rewrite`,
      runtime: cloudfront.FunctionRuntime.JS_2_0,
    })

    const apiOriginRequestPolicy = new cloudfront.OriginRequestPolicy(this, 'ApiOriginRequestPolicy', {
      cookieBehavior: cloudfront.OriginRequestCookieBehavior.none(),
      headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
        'CloudFront-Viewer-Address',
        'CloudFront-Viewer-Country',
        'CloudFront-Viewer-Country-Region',
        'CloudFront-Is-Mobile-Viewer',
        'CloudFront-Is-Tablet-Viewer',
        'CloudFront-Is-Desktop-Viewer',
        'CloudFront-Is-SmartTV-Viewer',
        'X-Oro-Admin-Token',
        'content-type',
      ),
      originRequestPolicyName: `${resourcePrefix}-api-origin-request`,
      queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
    })
    const securityHeaders = viewerSecurityHeaders(this, 'SecurityHeaders', `${resourcePrefix}-security-headers`)
    const adminSecurityHeaders = viewerSecurityHeaders(
      this,
      'AdminSecurityHeaders',
      `${resourcePrefix}-admin-security-headers`,
      true,
    )
    const lambdaOriginOptions = {
      originAccessControl: lambdaOac,
      readTimeout: Duration.seconds(30),
      responseCompletionTimeout: Duration.seconds(30),
    }

    const webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      defaultAction: { allow: {} },
      name: 'oro-observability-web-acl',
      rules: [
        {
          name: 'oro-observability-common-rules',
          overrideAction: { none: {} },
          priority: 10,
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesCommonRuleSet',
              vendorName: 'AWS',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'oro-observability-common-rules',
            sampledRequestsEnabled: false,
          },
        },
        {
          action: { block: {} },
          name: 'oro-observability-ingest-rate-limit',
          priority: 20,
          statement: {
            rateBasedStatement: {
              aggregateKeyType: 'IP',
              limit: 300,
              scopeDownStatement: {
                byteMatchStatement: {
                  fieldToMatch: { uriPath: {} },
                  positionalConstraint: 'EXACTLY',
                  searchString: '/api/observability/events',
                  textTransformations: [{ priority: 0, type: 'NONE' }],
                },
              },
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'oro-observability-ingest-rate-limit',
            sampledRequestsEnabled: false,
          },
        },
        {
          action: { block: {} },
          name: 'oro-observability-admin-rate-limit',
          priority: 30,
          statement: {
            rateBasedStatement: {
              aggregateKeyType: 'IP',
              limit: 60,
              scopeDownStatement: {
                byteMatchStatement: {
                  fieldToMatch: { uriPath: {} },
                  positionalConstraint: 'STARTS_WITH',
                  searchString: '/api/observability/admin/',
                  textTransformations: [{ priority: 0, type: 'NONE' }],
                },
              },
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'oro-observability-admin-rate-limit',
            sampledRequestsEnabled: false,
          },
        },
      ],
      scope: 'CLOUDFRONT',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'oro-observability-web-acl',
        sampledRequestsEnabled: false,
      },
    })

    const adminAssetsOac = new cloudfront.S3OriginAccessControl(this, 'AdminAssetsOac', {
      originAccessControlName: 'oro-observability-admin-assets-oac',
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    })
    const adminOrigin = origins.S3BucketOrigin.withOriginAccessControl(adminAssetsBucket, {
      originAccessControl: adminAssetsOac,
    })
    const ingestOrigin = origins.FunctionUrlOrigin.withOriginAccessControl(ingestUrl, lambdaOriginOptions)
    const apiOrigin = origins.FunctionUrlOrigin.withOriginAccessControl(adminUrl, lambdaOriginOptions)
    const amplifyOrigin = new origins.HttpOrigin(amplifyOriginDomain, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    })

    const distributionProps = {
      defaultBehavior: {
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        origin: amplifyOrigin,
        responseHeadersPolicy: securityHeaders,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        '/api/observability/admin/*': {
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          origin: apiOrigin,
          originRequestPolicy: apiOriginRequestPolicy,
          responseHeadersPolicy: securityHeaders,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        '/api/observability/events': {
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          origin: ingestOrigin,
          originRequestPolicy: apiOriginRequestPolicy,
          responseHeadersPolicy: securityHeaders,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        '/oro-admin*': {
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          functionAssociations: [{
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            function: adminPathFunction,
          }],
          origin: adminOrigin,
          responseHeadersPolicy: adminSecurityHeaders,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
      webAclId: webAcl.attrArn,
    }

    const distribution = new cloudfront.Distribution(this, 'Distribution', distributionProps)
    Tags.of(distribution).add('Name', 'oro-observability-distribution')

    new lambda.CfnPermission(this, 'IngestCloudFrontInvokePermission', {
      action: 'lambda:InvokeFunction',
      functionName: ingestFunction.functionName,
      principal: 'cloudfront.amazonaws.com',
      sourceArn: distribution.distributionArn,
    })
    new lambda.CfnPermission(this, 'AdminCloudFrontInvokePermission', {
      action: 'lambda:InvokeFunction',
      functionName: adminFunction.functionName,
      principal: 'cloudfront.amazonaws.com',
      sourceArn: distribution.distributionArn,
    })

    const githubOidcProviderArn = `arn:${Stack.of(this).partition}:iam::${account}:oidc-provider/token.actions.githubusercontent.com`
    const githubOidcProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this,
      'GitHubOidcProvider',
      githubOidcProviderArn,
    )
    const githubActionsRole = new iam.Role(this, 'GitHubActionsRole', {
      assumedBy: new iam.WebIdentityPrincipal(githubOidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': githubOidcSubject,
        },
      }),
      description: 'OIDC deployment role for the ORO observability GitHub Actions workflow.',
      maxSessionDuration: Duration.hours(1),
      roleName: `${resourcePrefix}-github-actions`,
    })
    const bootstrapRoleNames = [
      'deploy-role',
      'file-publishing-role',
      'lookup-role',
    ]
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      actions: ['sts:AssumeRole'],
      resources: bootstrapRoleNames.map(
        (roleName) => `arn:${Stack.of(this).partition}:iam::${account}:role/cdk-hnb659fds-${roleName}-${account}-${region}`,
      ),
      sid: 'AssumeExistingCdkBootstrapRoles',
    }))
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'cloudformation:DescribeStackEvents',
        'cloudformation:DescribeStackResources',
        'cloudformation:DescribeStacks',
      ],
      resources: ['*'],
      sid: 'ReadCloudFormationDeploymentStatus',
    }))
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [Stack.of(this).formatArn({
        resource: 'parameter',
        resourceName: 'cdk-bootstrap/hnb659fds/version',
        service: 'ssm',
      })],
      sid: 'ReadCdkBootstrapVersion',
    }))
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'cloudfront:CreateInvalidation',
        'cloudfront:GetDistribution',
        'cloudfront:GetDistributionConfig',
        'cloudfront:ListInvalidations',
      ],
      resources: [distribution.distributionArn],
      sid: 'PublishAdminAssets',
    }))
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetBucketLocation', 's3:ListBucket'],
      resources: [adminAssetsBucket.bucketArn],
      sid: 'ListAdminAssetsBucket',
    }))
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        's3:AbortMultipartUpload',
        's3:DeleteObject',
        's3:GetObject',
        's3:ListMultipartUploadParts',
        's3:PutObject',
      ],
      resources: [adminAssetsBucket.arnForObjects('*')],
      sid: 'SyncAdminAssets',
    }))
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      actions: ['amplify:CreateDeployment', 'amplify:StartDeployment'],
      resources: [cdk.Fn.join('', [homeownerBranch.attrArn, '/deployments/*'])],
      sid: 'PublishHomeownerApplication',
    }))
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      actions: ['amplify:GetJob'],
      resources: [cdk.Fn.join('', [homeownerBranch.attrArn, '/jobs/*'])],
      sid: 'ReadHomeownerDeploymentStatus',
    }))

    new cloudwatch.Alarm(this, 'IngestErrorsAlarm', {
      alarmName: `${resourcePrefix}-ingest-errors`,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 3,
      metric: ingestFunction.metricErrors({ period: Duration.minutes(5), statistic: 'Sum' }),
      threshold: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    })
    new cloudwatch.Alarm(this, 'AdminErrorsAlarm', {
      alarmName: `${resourcePrefix}-admin-errors`,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 3,
      metric: adminFunction.metricErrors({ period: Duration.minutes(5), statistic: 'Sum' }),
      threshold: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    })
    new cloudwatch.Alarm(this, 'DynamoThrottlesAlarm', {
      alarmName: `${resourcePrefix}-dynamodb-throttles`,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 3,
      metric: new cloudwatch.Metric({
        dimensionsMap: { TableName: eventsTable.tableName },
        metricName: 'ThrottledRequests',
        namespace: 'AWS/DynamoDB',
        period: Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    })
    new cloudwatch.Alarm(this, 'WafBlocksAlarm', {
      alarmName: `${resourcePrefix}-waf-blocks`,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 3,
      metric: new cloudwatch.Metric({
        dimensionsMap: {
          Region: 'CloudFront',
          Rule: 'ALL',
          WebACL: 'oro-observability-web-acl',
        },
        metricName: 'BlockedRequests',
        namespace: 'AWS/WAFV2',
        period: Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 100,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    })

    new cdk.CfnOutput(this, 'CloudFrontDomain', { value: distribution.domainName })
    new cdk.CfnOutput(this, 'CloudFrontDistributionId', { value: distribution.distributionId })
    new cdk.CfnOutput(this, 'AdminAssetsBucketName', { value: adminAssetsBucket.bucketName })
    new cdk.CfnOutput(this, 'AmplifyHomeownerAppId', { value: homeownerApp.attrAppId })
    new cdk.CfnOutput(this, 'AmplifyHomeownerBranchName', { value: homeownerBranch.attrBranchName })
    new cdk.CfnOutput(this, 'AmplifyHomeownerDomain', { value: amplifyOriginDomain })
    new cdk.CfnOutput(this, 'EventsTableName', { value: eventsTable.tableName })
    new cdk.CfnOutput(this, 'CognitoUserPoolId', { value: userPool.userPoolId })
    new cdk.CfnOutput(this, 'CognitoClientId', { value: adminClient.userPoolClientId })
    // domainName is only the Cognito prefix. CI needs the complete Hosted UI
    // URL when compiling the separate admin bundle.
    new cdk.CfnOutput(this, 'CognitoHostedUiDomain', { value: userPoolDomain.baseUrl() })
    new cdk.CfnOutput(this, 'GithubActionsRoleArn', { value: githubActionsRole.roleArn })
  }
}

export { ObservabilityMvpStack }
