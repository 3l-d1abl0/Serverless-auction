import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';

// Define custom authorizer type
export interface CustomAuthorizer {
   lambda: {
       email: string;
        aud: string;
        email_verified: string;
         exp: string;
        iat: string;
         iss: string;
         name: string;
         nickname: string;
         picture: string;
        sub: string;
         updated_at: string;
         [key: string]: any;
      };
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

export type LambdaHandler<
  TBody = unknown,
  TPathParams = { [key: string]: string },
  TQueryParams = { [key: string]: string | undefined }
> = Handler<CustomAPIGatewayProxyEvent<TBody, TPathParams, TQueryParams>, APIGatewayProxyResult>;

export default function commonMiddleware<
  TBody = unknown,
  TPathParams = { [key: string]: string },
  TQueryParams = { [key: string]: string | undefined }
>(handler: LambdaHandler<TBody, TPathParams, TQueryParams>) {
  return middy(handler)
    .use([
      httpJsonBodyParser(),
      httpEventNormalizer(),
      httpErrorHandler(),
      cors(),
    ]);
}
