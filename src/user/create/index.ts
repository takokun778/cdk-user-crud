import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import * as uuid from 'uuid';

import * as model from '../../out/models';

const options = {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566',
};

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'UserTable';

const dynamodb = new AWS.DynamoDB.DocumentClient(options);

exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // console.log(event.httpMethod);
    // console.log(event.pathParameters);
    // console.log(event.body);

    if (!event.body) {
        throw new Error('error');
    }

    const req = JSON.parse(event.body) as model.CreateUserInput;

    const id = uuid.v4();

    const params: DocumentClient.PutItemInput = {
        TableName: USER_TABLE_NAME,
        Item: {
            id: id,
            firstName: req.firstName,
            lastName: req.lastName,
        },
    };

    await dynamodb.put(params).promise();

    const res: model.User = {
        id: id,
        firstName: req.firstName,
        lastName: req.lastName,
    };

    return {
        statusCode: 200,
        body: JSON.stringify(res),
    };
};
