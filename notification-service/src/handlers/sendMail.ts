import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

interface EmailPayload {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing request body' })
      };
    }

    const payload: EmailPayload = JSON.parse(event.body);
    
    // Validate required fields
    if (!payload.to || !payload.from || !payload.subject) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required email fields' })
      };
    }

    // Convert to array if single recipient
    const toAddresses = Array.isArray(payload.to) ? payload.to : [payload.to];

    const params = {
      Source: payload.from,
      Destination: {
        ToAddresses: toAddresses
      },
      Message: {
        Subject: {
          Data: payload.subject,
          Charset: 'UTF-8'
        },
        Body: {
          ...(payload.text && {
            Text: {
              Data: payload.text,
              Charset: 'UTF-8'
            }
          }),
          ...(payload.html && {
            Html: {
              Data: payload.html,
              Charset: 'UTF-8'
            }
          })
        }
      }
    };

    await ses.send(new SendEmailCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' })
    };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // return {
    //   statusCode: 500,
    //   body: JSON.stringify({
    //     message: 'Failed to send email',
    //     error: (error as Error).message
    //   })
    // };
  }
}; 