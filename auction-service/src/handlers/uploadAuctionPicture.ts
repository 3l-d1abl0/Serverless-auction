import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { uploadPicturetoS3 } from "../lib/uploadPictureToS3";
import validator from '@middy/validator';
import createError from "http-errors";
import { setAuctionPictureUrl } from '../lib/setAuctionPictureUrl';
import uploadAuctionPictureSchema from '../lib/schemas/uploadAuctionPictureSchema';
import { LambdaHandler } from '../lib/commonMiddleware';
import commonMiddleware from '../lib/commonMiddleware';
import { Auction } from '../types/auction';
import config from '../lib/config';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Reimplement getAuctionById since we can't import it from getAuction.ts
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

interface PathParams {
  id: string;
}

const uploadAuctionPicture: LambdaHandler<string, PathParams> = async (event) => {
    const { id } = event.pathParameters;
    const { email } = event.requestContext.authorizer;
    const auction = await getAuctionById(id);

    // Check auction Owner
    if (auction.seller !== email) {
        throw new createError.Forbidden(`You are not the seller of this auction!`);
    }

    const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    let updatedAuction: Auction;

    try {
        const pictureUrl = await uploadPicturetoS3(auction.id + '.jpg', buffer);
        updatedAuction = await setAuctionPictureUrl(auction.id, pictureUrl);
        console.log(pictureUrl);
    } catch (error) {
        console.error(error);
        throw new createError.InternalServerError((error as Error).message);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(updatedAuction),
    };
};

export const handler = commonMiddleware<string, PathParams>(uploadAuctionPicture)
    .use(validator({
        eventSchema: uploadAuctionPictureSchema
    }));
