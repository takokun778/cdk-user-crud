#!/usr/bin/env node
import 'source-map-support/register';

import * as swagger from '@apidevtools/swagger-parser';
import * as cdk from '@aws-cdk/core';

import { CdkUserCrudStack } from '../lib/cdk-user-crud-stack';

async function createApp(): Promise<cdk.App> {
    const { STAGE = 'prod' } = process.env;

    const openApi: any = await swagger.dereference('api/openapi.yaml');

    const app = new cdk.App();

    new CdkUserCrudStack(app, 'CdkUserCrudStack', {
        stage: STAGE,
        openApi: openApi,
    });

    return app;
}

createApp();
