import * as apigateway from '@aws-cdk/aws-apigateway';
import { AttributeType, StreamViewType, Table } from '@aws-cdk/aws-dynamodb';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { Runtime, StartingPosition } from '@aws-cdk/aws-lambda';
import { DynamoEventSource, SqsEventSource, StreamEventSourceProps } from '@aws-cdk/aws-lambda-event-sources';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Queue } from '@aws-cdk/aws-sqs';
import * as cdk from '@aws-cdk/core';

export interface ApiProps extends cdk.StackProps {
    stage: string;
    openApi: any;
}

/**
 * API Gateway に Lambda の設定を追加するための肩
 */
interface IntegrationSetting {
    readonly type: string;
    readonly httpMethod: string;
    readonly uri: string;
    readonly payloadFormatVersion: string;
}

/**
 * CDKスタック
 */
export class CdkUserCrudStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: ApiProps) {
        super(scope, id, props);

        const AWS_REGION = 'us-east-1';
        const DYNAMODB_ENDPOINT = 'http://localhost:4566';

        // ----------------------------------------------------------------
        // DynamoDB
        // ----------------------------------------------------------------

        const userTable = new Table(this, 'UserTable', {
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING,
            },
            tableName: 'UserTable',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            stream: StreamViewType.NEW_IMAGE
        });

        // ----------------------------------------------------------------
        // SQS
        // ----------------------------------------------------------------

        const queue = new Queue(this, 'Queue', {});

        // ----------------------------------------------------------------
        // Lambda
        // ----------------------------------------------------------------

        const userCreateLambda = new NodejsFunction(this, 'UserCreateFunction', {
            entry: 'src/user/create/index.ts',
            bundling: {
                target: 'es2020',
            },
            runtime: Runtime.NODEJS_14_X,
            memorySize: 256,
            timeout: cdk.Duration.seconds(60),
            environment: {
                USER_TABLE_NAME: userTable.tableName,
                AWS_REGION: AWS_REGION,
                DYNAMODB_ENDPOINT: DYNAMODB_ENDPOINT,
                QUEUE_URL: queue.queueUrl,
            },
        });

        userCreateLambda.addToRolePolicy(
            new PolicyStatement({ actions: ['sqs:SendMessage'], resources: [queue.queueArn] })
        );

        userTable.grantFullAccess(userCreateLambda);

        const userReadLambda = new NodejsFunction(this, 'UserReadFunction', {
            entry: 'src/user/read/index.ts',
            bundling: {
                target: 'es2020',
            },
            runtime: Runtime.NODEJS_14_X,
            memorySize: 256,
            timeout: cdk.Duration.seconds(60),
            environment: {
                USER_TABLE_NAME: userTable.tableName,
                AWS_REGION: AWS_REGION,
                DYNAMODB_ENDPOINT: DYNAMODB_ENDPOINT,
            },
        });

        userTable.grantFullAccess(userReadLambda);

        const userUpdateLambda = new NodejsFunction(this, 'UserUpdateFunction', {
            entry: 'src/user/update/index.ts',
            bundling: {
                target: 'es2020',
            },
            runtime: Runtime.NODEJS_14_X,
            memorySize: 256,
            timeout: cdk.Duration.seconds(60),
            environment: {
                USER_TABLE_NAME: userTable.tableName,
                AWS_REGION: AWS_REGION,
                DYNAMODB_ENDPOINT: DYNAMODB_ENDPOINT,
            },
        });

        userTable.grantFullAccess(userUpdateLambda);

        const userDeleteLambda = new NodejsFunction(this, 'UserDeleteFunction', {
            entry: 'src/user/delete/index.ts',
            bundling: {
                target: 'es2020',
            },
            runtime: Runtime.NODEJS_14_X,
            memorySize: 256,
            timeout: cdk.Duration.seconds(60),
            environment: {
                USER_TABLE_NAME: userTable.tableName,
                AWS_REGION: AWS_REGION,
                DYNAMODB_ENDPOINT: DYNAMODB_ENDPOINT,
            },
        });

        userTable.grantFullAccess(userDeleteLambda);

        const eventLambda = new NodejsFunction(this, 'EventFunction', {
            entry: 'src/sqs/index.ts',
            bundling: {
                target: 'es2020',
            },
            runtime: Runtime.NODEJS_14_X,
            memorySize: 256,
            timeout: cdk.Duration.seconds(60),
        });

        // SQS を紐づける

        eventLambda.addEventSource(new SqsEventSource(queue));

        const streamLambda = new NodejsFunction(this, 'StreamFunction', {
            entry: 'src/stream/index.ts',
            bundling: {
                target: 'es2020',
            },
            runtime: Runtime.NODEJS_14_X,
            memorySize: 256,
            timeout: cdk.Duration.seconds(60),
        });

        // DynamoDBを紐づける

        const streamProps: StreamEventSourceProps = {
            startingPosition: StartingPosition.LATEST,
            batchSize: 1,
        };

        streamLambda.addEventSource(new DynamoEventSource(userTable, streamProps));

        // ----------------------------------------------------------------
        // API Gateway
        // ----------------------------------------------------------------

        // APIGatewayのOpenAPI独自拡張であるx-amazon-apigateway-integrationを追記
        Object.entries(props.openApi.paths).forEach(([path]) => {
            Object.entries(props.openApi.paths[path]).forEach(([method]) => {
                const integrationSetting: IntegrationSetting = {
                    type: 'AWS_PROXY',
                    httpMethod: 'POST',
                    // AWS上に構築したLambda関数を特定するための情報
                    uri: '',
                    payloadFormatVersion: '2.0',
                };
                if (path === '/user' && method === 'post') {
                    Object.assign(integrationSetting, { uri: userCreateLambda.functionArn });
                    props.openApi.paths[path][method]['x-amazon-apigateway-integration'] = integrationSetting;
                }
                if (path === '/user/{id}' && method === 'get') {
                    Object.assign(integrationSetting, { uri: userReadLambda.functionArn });
                    props.openApi.paths[path][method]['x-amazon-apigateway-integration'] = integrationSetting;
                }
                if (path === '/user/{id}' && method === 'put') {
                    Object.assign(integrationSetting, { uri: userUpdateLambda.functionArn });
                    props.openApi.paths[path][method]['x-amazon-apigateway-integration'] = integrationSetting;
                }
                if (path === '/user/{id}' && method === 'delete') {
                    Object.assign(integrationSetting, { uri: userDeleteLambda.functionArn });
                    props.openApi.paths[path][method]['x-amazon-apigateway-integration'] = integrationSetting;
                }
            });
        });

        const api = new apigateway.SpecRestApi(this, 'UserServiceEndPoint', {
            // OpenApiをAPI Gatewayに設定する
            apiDefinition: apigateway.ApiDefinition.fromInline(props.openApi),
        });
    }
}
