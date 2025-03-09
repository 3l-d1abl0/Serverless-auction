import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
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
      throw CreateError.NotFound(`Auction with ID "${id}" not found`);
    }

    auction = result.Item as Auction;
  } catch (error) {
    console.error(error);
    throw CreateError.InternalServerError((error as Error).message);
  }

  return auction;
}

const placeBid: LambdaHandler<BidBody, PathParams> = async (event) => {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const email  = event.requestContext.authorizer.lambda.email;

  const auction = await getAuctionById(id);

  // Bid identity validation
  if (email === auction.seller) {
    throw CreateError.Forbidden(`You cannot bid on your own auctions!`);
  }

  // Avoid double bidding
  if (email === auction.highestBid.bidder) {
    throw CreateError.Forbidden(`You are already the highest bidder`);
  }

  // Auction status validation
  if (auction.status !== 'OPEN') {
    throw CreateError.Forbidden(`You cannot bid on closed auctions!`);
  }

  // Bid amount validation
  if (amount <= auction.highestBid.amount) {
    throw CreateError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}!`);
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
    console.error('ERROR: ', error);
    throw CreateError.InternalServerError((error as Error).message);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
};

export const handler = middleware(placeBid);
