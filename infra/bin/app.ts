#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SmartBudgetStack } from '../lib/smart-budget-stack';

const app = new cdk.App();

const environment = (app.node.tryGetContext('environment') || 'dev') as 'dev' | 'staging' | 'prod';

new SmartBudgetStack(app, `SmartBudget-${environment}`, {
  environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'SmartBudget',
    Environment: environment,
    ManagedBy: 'CDK',
  },
});

app.synth();
