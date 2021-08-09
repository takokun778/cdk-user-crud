import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';

const options = {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566',
};

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'UserTable';

const dynamodb = new AWS.DynamoDB.DocumentClient(options);

exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (!event.pathParameters) {
        throw new Error('error');
    }

    const pathParam = event.pathParameters as { id: string };

    const params: DocumentClient.DeleteItemInput = {
        TableName: USER_TABLE_NAME,
        Key: {
            id: pathParam.id,
        },
    };

    const result = await dynamodb.delete(params).promise();

    return {
        statusCode: 200,
        body: JSON.stringify({}),
    };
};
