import * as cdk from 'aws-cdk-lib'
import { ObservabilityMvpStack } from '../lib/observability-mvp-stack.js'

const app = new cdk.App()

new ObservabilityMvpStack(app, 'oro-observability-mvp', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  adminRedirectUri: app.node.tryGetContext('adminRedirectUri'),
  cognitoDomainPrefix: app.node.tryGetContext('cognitoDomainPrefix'),
})
