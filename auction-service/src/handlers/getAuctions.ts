import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import CreateError from '../lib/errors';
import { LambdaHandler } from '../lib/middleware';
import middleware from '../lib/middleware';
import { Auction } from '../types/auction';
import config from '../lib/config';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface QueryParams {
  status?: string;
}

const getAuctions: LambdaHandler<unknown, {}, QueryParams> = async (event) => {
  const { status } = event.queryStringParameters || {};
  let auctions: Auction[];

  const params = {
    TableName: config.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndEndDate',
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeValues: {
      ':status': status || 'OPEN',
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  };

  try {
    const result = await docClient.send(new QueryCommand(params));
    auctions = result.Items as Auction[];
  } catch (error) {
    console.error('ERROR: ',error);
    throw CreateError.InternalServerError((error as Error).message);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
};

export const handler = middleware(getAuctions);
