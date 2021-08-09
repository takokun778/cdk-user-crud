import { DynamoDBStreamEvent } from 'aws-lambda';

exports.handler = async (event: DynamoDBStreamEvent): Promise<void> => {
    console.log('Hello world from dynamodb stream lambda!');
    event.Records.forEach(record => {
        console.log(record);
    });
};
