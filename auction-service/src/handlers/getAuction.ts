import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import createError from 'http-errors';
import { LambdaHandler } from '../lib/commonMiddleware';
import commonMiddleware from '../lib/commonMiddleware';
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
      throw new createError.NotFound(`Auction with ID "${id}" not found`);
    }

    auction = result.Item as Auction;
  } catch (error) {
    console.error('ERROR: ',error);
    throw new createError.InternalServerError((error as Error).message);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
};

export const handler = commonMiddleware(getAuction);
