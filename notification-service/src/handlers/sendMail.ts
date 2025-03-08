import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SQSEvent, SQSRecord, Context } from 'aws-lambda';

interface EmailPayload {
  subject: string;
  body: string;
  recipient: string;
}

const ses = new SESClient({ region: 'ap-south-1' });

async function sendMail(event: SQSEvent, context: Context): Promise<any> {
  try {
    const record: SQSRecord = event.Records[0];
    console.log('Email Processing ', record);

    const email: EmailPayload = JSON.parse(record.body);
    const { subject, body, recipient } = email;

    const params = {
      Source: 'sameer.generalist@gmail.com',
      Destination: {
        ToAddresses: [recipient],
      },
      Message: {
        Body: {
          Text: {
            Data: body,
          },
        },
        Subject: {
          Data: subject,
        },
      },
    };

    const command = new SendEmailCommand(params);
    const result = await ses.send(command);
    console.log(result);
    return result;
  } catch (error) {
    console.error(error);
    throw error; // Re-throw to ensure AWS Lambda marks this as a failed execution
  }
}

export const handler = sendMail;
