import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { ObservabilityMvpStack } from '../lib/observability-mvp-stack.js'

function synthesizedTemplate() {
  const app = new cdk.App()
  const stack = new ObservabilityMvpStack(app, 'TestStack', {
    amplifyOriginDomain: 'example.amplifyapp.com',
    cognitoDomainPrefix: 'oro-observability-test',
    env: { account: '123456789012', region: 'us-east-1' },
  })
  return Template.fromStack(stack)
}

test('creates two IAM-protected Lambda URLs and no public API Gateway', () => {
  const template = synthesizedTemplate()
  template.resourceCountIs('AWS::Lambda::Url', 2)
  template.hasResourceProperties('AWS::Lambda::Url', { AuthType: 'AWS_IAM' })
  template.resourceCountIs('AWS::ApiGateway::RestApi', 0)
  template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 0)
  template.resourceCountIs('AWS::EC2::VPC', 0)
})

test('stores encrypted expiring events with a query index', () => {
  const template = synthesizedTemplate()
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    AttributeDefinitions: [
      { AttributeName: 'eventId', AttributeType: 'S' },
      { AttributeName: 'GSI1PK', AttributeType: 'S' },
      { AttributeName: 'GSI1SK', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [{ IndexName: 'GSI1' }],
    SSESpecification: { SSEEnabled: true },
    TimeToLiveSpecification: { AttributeName: 'expiresAt', Enabled: true },
  })
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'oro-observability-events',
  })
})

test('protects CloudFront origins and keeps buckets private', () => {
  const template = synthesizedTemplate()
  template.resourceCountIs('AWS::CloudFront::Distribution', 1)
  template.resourceCountIs('AWS::CloudFront::OriginAccessControl', 2)
  template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
    OriginAccessControlConfig: {
      Name: 'oro-observability-admin-assets-oac',
      OriginAccessControlOriginType: 's3',
      SigningBehavior: 'always',
      SigningProtocol: 'sigv4',
    },
  })
  template.resourceCountIs('AWS::WAFv2::WebACL', 1)
  const buckets = template.findResources('AWS::S3::Bucket')
  assert.equal(Object.keys(buckets).length, 2)
  for (const bucket of Object.values(buckets)) {
    assert.deepEqual(bucket.Properties.PublicAccessBlockConfiguration, {
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    })
  }
})

test('creates an isolated manual-deploy Amplify origin without a custom domain', () => {
  const template = synthesizedTemplate()
  template.hasResourceProperties('AWS::Amplify::App', {
    Name: 'oro-homeowner',
    Platform: 'WEB',
  })
  template.hasResourceProperties('AWS::Amplify::Branch', {
    BranchName: 'main',
    EnableAutoBuild: false,
    Stage: 'PRODUCTION',
  })
  const apps = Object.values(template.findResources('AWS::Amplify::App'))
  assert.deepEqual(apps[0].Properties.CustomRules, [])
  template.resourceCountIs('AWS::Amplify::Domain', 0)
  const outputs = template.findOutputs('*')
  assert.doesNotMatch(JSON.stringify(outputs.AmplifyHomeownerDomain.Value), /attrAppId/)
})

test('scopes direct Lambda invocation permissions to the CloudFront distribution', () => {
  const template = synthesizedTemplate()
  const permissions = Object.values(template.findResources('AWS::Lambda::Permission'))
    .filter((permission) => permission.Properties.Action === 'lambda:InvokeFunction')
  assert.equal(permissions.length, 2)
  for (const permission of permissions) {
    assert.equal(permission.Properties.Principal, 'cloudfront.amazonaws.com')
    assert.match(JSON.stringify(permission.Properties.SourceArn), /Distribution/)
  }
})

test('uses oro-prefixed physical names and keeps custom-domain resources out of scope', () => {
  const template = synthesizedTemplate()
  template.hasResourceProperties('AWS::Lambda::Function', {
    FunctionName: 'oro-observability-ingest',
  })
  template.hasResourceProperties('AWS::Lambda::Function', {
    FunctionName: 'oro-observability-admin',
  })
  template.hasResourceProperties('AWS::Cognito::UserPool', {
    UserPoolName: 'oro-observability-admin-user-pool',
  })
  const buckets = Object.values(template.findResources('AWS::S3::Bucket'))
  for (const bucket of buckets) {
    assert.match(JSON.stringify(bucket.Properties.BucketName), /oro-observability-/)
  }
  template.resourceCountIs('AWS::CertificateManager::Certificate', 0)
  template.resourceCountIs('AWS::Route53::RecordSet', 0)
})

test('creates a GitHub OIDC role restricted to the ORO repository environment', () => {
  const template = synthesizedTemplate()
  const roles = Object.values(template.findResources('AWS::IAM::Role'))
  const githubRole = roles.find((role) => role.Properties.RoleName === 'oro-observability-github-actions')
  assert.ok(githubRole)
  const trustPolicy = JSON.stringify(githubRole.Properties.AssumeRolePolicyDocument)
  assert.match(trustPolicy, /token\.actions\.githubusercontent\.com/)
  assert.match(trustPolicy, /repo:tripleten-externships\/oro_team2:environment:oro-production/)
  assert.match(trustPolicy, /sts\.amazonaws\.com/)
  assert.doesNotMatch(trustPolicy, /:iam:us-east-1:/)
})

test('scopes GitHub Amplify publishing to deployment jobs on the ORO homeowner branch', () => {
  const template = synthesizedTemplate()
  const policies = JSON.stringify(template.findResources('AWS::IAM::Policy'))
  assert.match(policies, /amplify:CreateDeployment/)
  assert.match(policies, /amplify:StartDeployment/)
  assert.match(policies, /\/deployments\/\*/)
  assert.match(policies, /\/jobs\/\*/)
})

test('exposes only deployment identifiers needed by the CI workflow', () => {
  const template = synthesizedTemplate()
  for (const outputName of [
    'CloudFrontDomain',
    'CloudFrontDistributionId',
    'AdminAssetsBucketName',
    'AmplifyHomeownerAppId',
    'AmplifyHomeownerBranchName',
    'AmplifyHomeownerDomain',
    'EventsTableName',
    'CognitoUserPoolId',
    'CognitoClientId',
    'CognitoHostedUiDomain',
    'GithubActionsRoleArn',
  ]) {
    template.hasOutput(outputName, {})
  }
})

test('uses optional TOTP MFA without creating an SMS service role', () => {
  const template = synthesizedTemplate()
  const userPools = Object.values(template.findResources('AWS::Cognito::UserPool'))
  assert.equal(userPools.length, 1)
  assert.equal(userPools[0].Properties.SmsConfiguration, undefined)
})

test('scopes export and admin-asset S3 permissions to the exact required actions', () => {
  const template = synthesizedTemplate()
  const policies = JSON.stringify(template.findResources('AWS::IAM::Policy'))
  assert.match(policies, /CreateAndSignScopedExports/)
  assert.match(policies, /SyncAdminAssets/)
  assert.doesNotMatch(policies, /PutObjectLegalHold|PutObjectRetention|PutObjectTagging/)
})

test('leaves the SigV4 checksum header to CloudFront OAC rather than forwarding a custom checksum', () => {
  const template = synthesizedTemplate()
  const policies = JSON.stringify(template.findResources('AWS::CloudFront::OriginRequestPolicy'))
  assert.doesNotMatch(policies, /X-Oro-Content-Sha256/)
  assert.doesNotMatch(policies, /x-amz-content-sha256/i)
})

test('allows only self-hosted and bundled data images in the admin CSP', () => {
  const template = synthesizedTemplate()
  const policies = JSON.stringify(template.findResources('AWS::CloudFront::ResponseHeadersPolicy'))
  assert.match(policies, /img-src 'self' data:/)
  assert.doesNotMatch(policies, /img-src \*/)
})
