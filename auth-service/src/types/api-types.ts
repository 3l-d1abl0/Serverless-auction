import { APIGatewayTokenAuthorizerEvent, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export interface Claims {
  sub: string;
  [key: string]: any;
}

export interface PolicyDocument {
  Version: string;
  Statement: {
    Action: string;
    Effect: string;
    Resource: string;
  }[];
}

export interface AuthResponse {
  principalId: string;
  policyDocument: PolicyDocument;
  context?: Claims;
}
