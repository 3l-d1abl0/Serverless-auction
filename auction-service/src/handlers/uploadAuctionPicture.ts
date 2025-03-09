import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { uploadPicturetoS3 } from "../lib/uploadPictureToS3";
import CreateError from "../lib/errors";
import { LambdaHandler } from '../lib/middleware';
import middleware from '../lib/middleware';
import { Auction } from '../types/auction';
import config from '../lib/config';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface PathParams {
  id: string;
}

const uploadAuctionPicture: LambdaHandler<any, PathParams> = async (event) => {
  const { id } = event.pathParameters;
  const { email } = event.requestContext.authorizer;
  const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');

  let auction: Auction;

  // Get auction
  try {
    const result = await docClient.send(new GetCommand({
      TableName: config.AUCTIONS_TABLE_NAME,
      Key: { id },
    }));

    auction = result.Item as Auction;

    // Validate auction exists
    if (!auction) {
      throw CreateError.NotFound(`Auction with ID "${id}" not found`);
    }

    // Validate ownership
    if (auction.seller !== email) {
      throw CreateError.Forbidden(`You are not the seller of this auction!`);
    }
  } catch (error) {
    console.error(error);
    throw CreateError.InternalServerError((error as Error).message);
  }

  // Upload to S3
  let pictureUrl: string;
  try {
    pictureUrl = await uploadPicturetoS3(`${auction.id}.jpg`, buffer);
  } catch (error) {
    console.error(error);
    throw CreateError.InternalServerError((error as Error).message);
  }

  // Update auction with picture URL
  try {
    await docClient.send(new UpdateCommand({
      TableName: config.AUCTIONS_TABLE_NAME,
      Key: { id },
      UpdateExpression: 'set pictureUrl = :pictureUrl',
      ExpressionAttributeValues: {
        ':pictureUrl': pictureUrl,
      },
      ReturnValues: 'ALL_NEW',
    }));
  } catch (error) {
    console.error(error);
    throw CreateError.InternalServerError((error as Error).message);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ pictureUrl }),
  };
};

export const handler = middleware(uploadAuctionPicture);
