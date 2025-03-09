import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';
import createError from 'http-errors';
import validator from '@middy/validator';
import commonMiddleware from '../lib/commonMiddleware';
import createAuctionSchema from '../lib/schemas/createAuctionSchema';
import { LambdaHandler } from '../lib/commonMiddleware';
import { Auction } from '../types/auction';
import config from '../lib/config';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface CreateAuctionBody {
  title: string;
}

const createAuction: LambdaHandler<CreateAuctionBody> = async (event) => {
  if (!event.body) {
    throw new createError.BadRequest('Missing request body');
  }

  const { title } = event.body;
  const { email } = event.requestContext.authorizer;

  if (!title) {
    throw new createError.BadRequest('Title is required');
  }

  if (!email) {
    throw new createError.Unauthorized('Email is required');
  }

  const now = new Date();
  const endDate = new Date();
  endDate.setHours(now.getHours() + 1);

  const auction: Auction = {
    id: uuid(),
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
    throw new createError.InternalServerError((error as Error).message);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
};

export const handler = commonMiddleware<CreateAuctionBody>(createAuction)
  .use(validator({ eventSchema: createAuctionSchema }));
