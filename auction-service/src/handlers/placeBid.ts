import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import createError from 'http-errors';
import validator from '@middy/validator';
import { LambdaHandler } from '../lib/commonMiddleware';
import commonMiddleware from '../lib/commonMiddleware';
import placeBidSchema from '../lib/schemas/placeBidSchema';
import { Auction } from '../types/auction';
import config from '../lib/config';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface PathParams {
  id: string;
}

interface BidBody {
  amount: number;
}

async function getAuctionById(id: string): Promise<Auction> {
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
    console.error(error);
    throw new createError.InternalServerError((error as Error).message);
  }

  return auction;
}

const placeBid: LambdaHandler<BidBody, PathParams> = async (event) => {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);

  // Bid identity validation
  if (email === auction.seller) {
    throw new createError.Forbidden(`You cannot bid on your own auctions!`);
  }

  // Avoid double bidding
  if (email === auction.highestBid.bidder) {
    throw new createError.Forbidden(`You are already the highest bidder`);
  }

  // Auction status validation
  if (auction.status !== 'OPEN') {
    throw new createError.Forbidden(`You cannot bid on closed auctions!`);
  }

  // Bid amount validation
  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}!`);
  }

  let updatedAuction: Auction;

  try {
    const params = {
      TableName: config.AUCTIONS_TABLE_NAME,
      Key: { id },
      UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
      ExpressionAttributeValues: {
        ':amount': amount,
        ':bidder': email,
      },
      ReturnValues: 'ALL_NEW' as const,
    };

    const result = await docClient.send(new UpdateCommand(params));
    updatedAuction = result.Attributes as Auction;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError((error as Error).message);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
};

export const handler = commonMiddleware(placeBid)
  .use(validator({ eventSchema: placeBidSchema }));
