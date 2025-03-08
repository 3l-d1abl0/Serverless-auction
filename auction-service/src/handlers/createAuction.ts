import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';
import createError from 'http-errors';
import validator from '@middy/validator';
import commonMiddleware from '../lib/commonMiddleware.js';
import { createAuctionSchema } from '../lib/schemas/createAuctionSchema.js';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Auction } from '../types/auction';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

async function createAuction(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    throw new createError.BadRequest('Missing request body');
  }

  const { title } = JSON.parse(event.body) as { title: string };
  const email = event.requestContext.authorizer?.email;

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
      TableName: process.env.AUCTIONS_TABLE_NAME,
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
}

export const handler = commonMiddleware(createAuction)
  .use(validator({ eventSchema: createAuctionSchema }));
