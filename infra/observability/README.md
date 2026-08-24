# ORO Observability Infrastructure

This isolated CDK package creates only new `oro-*` resources for the observability MVP. It creates a manual-deploy Amplify Hosting app for the public homeowner bundle and uses that new app as CloudFront's default origin. It does not update or replace GitHub Pages, DNS, ACM, or Route 53 resources.

## Deployment model

- Region: `us-east-1`.
- Public application URL: the generated CloudFront hostname.
- Amplify Hosting: new manual-deploy origin for CloudFront; no GitHub token, repository connection, or custom domain.
- Custom domains: intentionally unsupported for this MVP.
- Homeowner tracking: disabled until the CloudFront and admin flow are validated.

The stack creates DynamoDB, a new Amplify Hosting app and production branch, two private S3 buckets, Cognito, two Lambda function URLs protected by CloudFront OAC, WAF, CloudWatch alarms, and the `oro-observability-github-actions` OIDC role. It assumes the account already has the standard CDK bootstrap resources and GitHub's `token.actions.githubusercontent.com` OIDC provider.

## Local validation

From this directory:

```sh
npm ci
npm test
npm run cdk -- synth \
  -c cognitoDomainPrefix=oro-admin-your-unique-prefix
```

The first deployment uses the safe, non-routable callback `https://bootstrap.invalid/oro-admin/`. After it completes, read the `CloudFrontDomain` output and redeploy with the real CloudFront callback. `--parameters` is required here: `-c adminRedirectUri` changes the CDK template default but does not replace the value already stored for the CloudFormation parameter.

```sh
npm run cdk -- deploy oro-observability-mvp --require-approval never \
  --parameters "oro-observability-mvp:AdminRedirectUri=https://<cloudfront-domain>/oro-admin/" \
  -c cognitoDomainPrefix=oro-admin-your-unique-prefix \
  -c adminRedirectUri=https://<cloudfront-domain>/oro-admin/
```

Only then build and upload the admin bundle and public homeowner bundle.

## One-time bootstrap

Run the initial deployment locally with an authorized AWS principal. It creates the new ORO stack and its GitHub OIDC role. The existing GitHub OIDC provider and CDK bootstrap resources are used without modification.

After bootstrap, configure the GitHub environment `oro-production` with non-secret variables:

```text
AWS_REGION=us-east-1
AWS_ROLE_ARN=<GithubActionsRoleArn output>
ORO_STACK_NAME=oro-observability-mvp
COGNITO_DOMAIN_PREFIX=oro-admin-your-unique-prefix
OBSERVABILITY_TRACKING_ENABLED=false
```

The manual GitHub workflow performs subsequent CDK deploys, builds `dist-admin`, publishes it only to the new admin-assets bucket, builds the homeowner bundle, publishes every bundle file to the new Amplify app using short-lived upload URLs, and invalidates only paths on the new ORO CloudFront distribution. GitHub Pages remains unchanged.

## Frontend build values

After a successful stack deployment, use its outputs to build the admin bundle:

```sh
VITE_COGNITO_DOMAIN=https://your-prefix.auth.us-east-1.amazoncognito.com \
VITE_COGNITO_CLIENT_ID=your-client-id \
VITE_COGNITO_REDIRECT_URI=https://your-cloudfront-domain/oro-admin/ \
npm run build:admin
```

These `VITE_*` values are public browser configuration, not secrets. Do not create a Cognito client secret for this SPA. Never store AWS keys, Cognito passwords, JWTs, refresh tokens, raw IPs, or exports in the repository or GitHub variables.

The homeowner tracker stays disabled until edge validation passes:

```sh
VITE_OBSERVABILITY_ENABLED=false npm run build
```

The manual ORO workflow reads `OBSERVABILITY_TRACKING_ENABLED` from the protected GitHub environment. Keep it `false` through edge validation; changing it to `true` later changes only the public bundle build, not the hosting architecture.
