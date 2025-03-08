import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Auction } from '../types/auction';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function getAuctionById(id: string): Promise<Auction> {
  let auction: Auction;

  try {
    const result = await dynamodb.get({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: { id },
    }).promise();

    auction = result.Item;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  if (!auction) {
    throw new createError.NotFound(`Auction with ID "${id}" not Found !`);
  }

  return auction;
}

async function getAuction(event: APIGatewayProxyEvent & { pathParameters: { id: string } }): Promise<APIGatewayProxyResult> {
  const { id } = event.pathParameters;
  const auction = await getAuctionById(id);

  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
}

export const handler = commonMiddleware(getAuction);
