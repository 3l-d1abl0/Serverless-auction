import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import uuid from '../lib/uuid';
import CreateError from '../lib/errors';
import { LambdaHandler } from '../lib/middleware';
import middleware from '../lib/middleware';
import { Auction } from '../types/auction';
import config from '../lib/config';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface CreateAuctionBody {
  title: string;
}

const createAuction: LambdaHandler<CreateAuctionBody> = async (event) => {
  if (!event.body) {
    throw CreateError.BadRequest('Missing request body');
  }

  const { title } = event.body;
  const { email } = event.requestContext.authorizer;

  if (!title) {
    throw CreateError.BadRequest('Title is required');
  }

  if (!email) {
    throw CreateError.Unauthorized('Email is required');
  }

  const now = new Date();
  const endDate = new Date();
  endDate.setHours(now.getHours() + 1);

  const auction: Auction = {
    id: uuid.v4(),
    title,
    status: 'OPEN',
    createdAt: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0,
    },
    seller: email,
  };

  try {
    await docClient.send(new PutCommand({
      TableName: config.AUCTIONS_TABLE_NAME,
      Item: auction,
    }));
  } catch (error) {
    console.error(error);
    throw CreateError.InternalServerError((error as Error).message);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
};

export const handler = middleware(createAuction);
