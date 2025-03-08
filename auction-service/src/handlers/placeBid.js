import AWS from 'aws-sdk';
import createError from 'http-errors';
import validator from '@middy/validator';
import placeBidSchema from '../lib/schemas/placeBidSchema';
import commonMiddleware from '../lib/commonMiddleware';
import { getAuctionById } from './getAuction';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {

  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);

  //if Bidder is the Seller
  if(email === auction.seller){
    throw new createError.Forbidden(`Cant bid on your own auctions !`);
  }

  //check if user is already the highest bidder
  if(email === auction.highestBid.bidder){
    throw new createError.Forbidden(`Already the highest Bidder !`);
  }

  //check if auction is closed
  if(auction.status !== 'OPEN'){
    throw new createError.Forbidden(`You cannot bid on closed Auctions`);
  }

  //check if bid amount is less than the highest Bid
  if (amount <= auction.highestBid.amount){
    throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}`);
  }

    const params = {
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: { id },
      UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
      ExpressionAttributeValues: {
        ':amount': amount,
        ':bidder': email,
      },
      ReturnValues: 'ALL_NEW',
    };

//execute sdk
let updatedAuction;
try{

  const result = await dynamodb.update(params).promise();
  updatedAuction = result.Attributes;

}catch(error){
  console.error(error);
  throw new createError.InternalServerError(error);
}

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = commonMiddleware(placeBid)
  .use(validator({ inputSchema: placeBidSchema}));


