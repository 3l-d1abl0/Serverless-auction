import { jwtVerify } from 'jose';
import { createPublicKey, X509Certificate } from 'crypto';
import type { APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import type { Claims, AuthResponse as CustomAuthResponse } from '../types/api-types';


// By default, API Gateway authorizations are cached (TTL) for 300 seconds.
// This policy will authorize all requests to the same API Gateway instance where the
// request is coming from, thus being efficient and optimising costs.
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
    // Import the public key as a crypto key
    const publicKeyPEM = process.env.AUTH0_PUBLIC_KEY!;
    // Create X509 certificate from PEM
    const cert = new X509Certificate(publicKeyPEM);
    const key = cert.publicKey;

    // Verify the token
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['RS256'] 
    });
    const claims = payload as unknown as Claims;
    
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
