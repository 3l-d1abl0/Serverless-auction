import AWS from 'aws-sdk';
import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import htpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function getAuctionById(id){

  let auction;

  try{

    const result = await dynamodb.get({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
    }).promise();

    auction = result.Item;
  }catch(error){
    console.error(error);
    throw new createError.InternalServerError(error);
  }

    if(!auction){
        throw new createError.NotFound(`Auction with ID "${id}" not Found !`);
    }

  return auction;
}

async function getAuction(event, context) {

  const { id } = event.pathParameters;
  const auction = await getAuctionById(id);

  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
}

export const handler = middy(getAuction)
.use(httpJsonBodyParser())
.use(httpEventNormalizer())
.use(htpErrorHandler());


