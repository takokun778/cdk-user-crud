import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';

import * as model from '../../out/models';

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

    if (!event.body) {
        throw new Error('error');
    }

    const pathParam = event.pathParameters as { id: string };

    const req = JSON.parse(event.body) as model.UpdateUserInput;

    if (!req.firstName && !req.lastName) {
        throw new Error('error');
    }

    console.log(req);

    const params: DocumentClient.UpdateItemInput = {
        TableName: USER_TABLE_NAME,
        Key: {
            id: pathParam.id,
        },
        ExpressionAttributeNames: {},
        ExpressionAttributeValues: {},
        UpdateExpression: '',
        ReturnValues: 'ALL_NEW',
    };

    const expression = [];

    if (req.firstName) {
        Object.assign(params.ExpressionAttributeNames, { '#f': 'firstName' });
        Object.assign(params.ExpressionAttributeValues, { ':f': req.firstName });
        expression.push('#f = :f');
    }

    if (req.lastName) {
        Object.assign(params.ExpressionAttributeNames, { '#l': 'lastName' });
        Object.assign(params.ExpressionAttributeValues, { ':l': req.lastName });
        expression.push('#l = :l');
    }

    params.UpdateExpression = 'SET ' + (expression.length > 1 ? expression.join(',') : expression.pop()!);

    const result = await dynamodb.update(params).promise();

    return {
        statusCode: 200,
        body: JSON.stringify(result.Attributes as model.User),
    };
};
