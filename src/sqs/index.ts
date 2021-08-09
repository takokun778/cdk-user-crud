import { SQSEvent } from 'aws-lambda';

exports.handler = async (event: SQSEvent): Promise<void> => {
    console.log('Hello world from sqs lambda!');
    event.Records.forEach(record => {
        console.log(record);
    });
};
