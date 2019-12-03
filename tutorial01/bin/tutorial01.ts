#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { Tutorial01Stack } from '../lib/tutorial01-stack';

const app = new cdk.App();
new Tutorial01Stack(app, 'Tutorial01Stack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});
