import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import CreateError from '../lib/errors';
import { LambdaHandler } from '../lib/middleware';
import middleware from '../lib/middleware';
import { Auction } from '../types/auction';
import config from '../lib/config';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface PathParams {
  id: string;
}

const getAuction: LambdaHandler<any, PathParams> = async (event) => {
  const { id } = event.pathParameters;
  let auction: Auction;

  try {
    const result = await docClient.send(new GetCommand({
      TableName: config.AUCTIONS_TABLE_NAME,
      Key: { id },
    }));

    if (!result.Item) {
      throw CreateError.NotFound(`Auction with ID "${id}" not found`);
    }

    auction = result.Item as Auction;
  } catch (error) {
    console.error('ERROR: ',error);
    throw CreateError.InternalServerError((error as Error).message);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
};

export const handler = middleware(getAuction);
