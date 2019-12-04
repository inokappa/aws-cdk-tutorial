#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { Tutorial01Stack } from '../lib/tutorial01-stack';

const deployEnv = process.env.DEPLOY_ENV ? process.env.DEPLOY_ENV : 'dev';

const app = new cdk.App();
new Tutorial01Stack(app, `Tutorial01Stack-${deployEnv}`, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    },
    domain: 'example.com',
    project: 'my-project',
    issue: 'my-issue',
    owner: 'My Team',
    certificate_arn: { dev: 'arn:aws:acm:us-east-1:123456789012:certificate/xxxxxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxxxxx',
                       production: 'arn:aws:acm:us-east-1:123456789012:certificate/xxxxxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxxxxx' },
    logbucket_name: 'my-log-bucket-name',
    webacl_id: 'xxxxxxxxx-xxxx-xxxx-xxxxx-xxxxxxxx'
});
