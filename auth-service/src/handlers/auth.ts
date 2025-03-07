import { APIGatewayTokenAuthorizerEvent, AuthResponse } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { Claims, AuthResponse as CustomAuthResponse } from '../types/api-types';

const generatePolicy = (principalId: string, methodArn: string): CustomAuthResponse => {

  const apiGatewayWildcard = methodArn.split('/', 2).join('/') + '/*';

  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: apiGatewayWildcard,
        },
      ],
    },
  };
};

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<CustomAuthResponse> => {
  
  if (!event.authorizationToken) {
    throw 'Unauthorized';
  }

  const token = event.authorizationToken.replace('Bearer ', '');

  try {
    const claims = jwt.verify(token, process.env.AUTH0_PUBLIC_KEY!) as Claims;
    const policy = generatePolicy(claims.sub, event.methodArn);

    return {
      ...policy,
      context: claims
    };
  } catch (error) {
    console.log(error);
    throw 'Unauthorized';
  }
};
