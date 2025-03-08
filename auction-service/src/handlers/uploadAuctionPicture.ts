import { getAuctionById } from "./getAuction.js";
import { uploadPicturetoS3 } from "../lib/uploadPictureToS3.js";
import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import validator from '@middy/validator';
import createHttpError from "http-errors";
import { setAuctionPictureUrl } from '../lib/setAuctionPictureUrl.js';
import uploadAuctionPictureSchema from '../lib/schemas/uploadAuctionPictureSchema.js';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Auction } from '../types/auction';

export async function uploadAuctionPicture(event: APIGatewayProxyEvent & {
    pathParameters: { id: string },
    requestContext: { authorizer: { email: string } }
}): Promise<APIGatewayProxyResult> {
    const { id } = event.pathParameters;
    const { email } = event.requestContext.authorizer;
    const auction = await getAuctionById(id);

    // Check auction Owner
    if (auction.seller !== email) {
        throw new createHttpError.Forbidden(`You are not the seller of this auction !`);
    }

    const base64 = event.body!.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    let updatedAuction: Auction;

    try {
        const pictureUrl = await uploadPicturetoS3(auction.id + '.jpg', buffer);
        updatedAuction = await setAuctionPictureUrl(auction.id, pictureUrl);
        console.log(pictureUrl);
    } catch (error) {
        console.error(error);
        throw new createHttpError.InternalServerError((error as Error).message);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(updatedAuction),
    };
}

export const handler = middy(uploadAuctionPicture)
    .use(httpErrorHandler())
    .use(validator({
        eventSchema: uploadAuctionPictureSchema
    }))
    .use(cors());
