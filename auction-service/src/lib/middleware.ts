// Custom middleware utility to replace @middy packages
// This is ESM-compatible and avoids dynamic requires

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Define custom authorizer type
export interface CustomAuthorizer {
  email: string;
}

// Define custom event type that ensures required properties
export type CustomAPIGatewayProxyEvent<
  TBody = unknown,
  TPathParams = { [key: string]: string },
  TQueryParams = { [key: string]: string | undefined }
> = Omit<APIGatewayProxyEvent, 'body' | 'pathParameters' | 'queryStringParameters' | 'requestContext'> & {
  body: TBody;
  pathParameters: TPathParams;
  queryStringParameters: TQueryParams | null;
  requestContext: {
    authorizer: CustomAuthorizer;
    [key: string]: any;
  };
};

// Define handler types
export type LambdaHandler<
  TBody = unknown,
  TPathParams = { [key: string]: string },
  TQueryParams = { [key: string]: string | undefined }
> = (
  event: CustomAPIGatewayProxyEvent<TBody, TPathParams, TQueryParams>,
  context: Context
) => Promise<APIGatewayProxyResult>;

export type WrappedHandler = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

// Simplified middleware implementation
export function middleware<
  TBody = unknown,
  TPathParams = { [key: string]: string },
  TQueryParams = { [key: string]: string | undefined }
>(handler: LambdaHandler<TBody, TPathParams, TQueryParams>): WrappedHandler {
  return async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
      // Parse JSON body if it's a string
      if (typeof event.body === 'string') {
        try {
          (event as any).body = JSON.parse(event.body);
        } catch (e) {
          // If parsing fails, keep the original body
        }
      }

      // Ensure pathParameters exists
      if (!event.pathParameters) {
        (event as any).pathParameters = {};
      }

      // Ensure queryStringParameters exists
      if (!event.queryStringParameters) {
        (event as any).queryStringParameters = {};
      }

      // Add CORS headers to all responses
      const response = await handler(event as any, context);
      
      if (!response) {
        throw new Error('Handler returned undefined');
      }
      
      return {
        ...response,
        headers: {
          ...response.headers,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
      };
    } catch (error: any) {
      // Error handling
      console.error(error);
      
      // Handle custom errors from our error utility
      if (error.statusCode) {
        return {
          statusCode: error.statusCode,
          body: JSON.stringify({
            error: error.name,
            message: error.message,
          }),
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
          },
        };
      }
      
      // Handle other errors
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: error.message || 'An unknown error occurred',
        }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
      };
    }
  };
}

// Export as default to mimic commonMiddleware
export default middleware; 