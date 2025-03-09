import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Claims } from '../types/api-types';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  
  // Log the Lambda context
  /*console.log('Lambda Context:', {
    awsRequestId: context.awsRequestId,
    functionName: context.functionName,
    functionVersion: context.functionVersion,
    memoryLimitInMB: context.memoryLimitInMB,
    remainingTime: context.getRemainingTimeInMillis(),
  });
  
  const claims = event.requestContext.authorizer as Claims;
  console.log(event);
  */
  
  /* Required for CORS support to work */
  /* Required for cookies, authorization headers with HTTPS */
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      message: 'Hi ⊂◉‿◉つ from Private API',
      event,
      context
    }),
  };
};
