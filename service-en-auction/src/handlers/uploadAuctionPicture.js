import { getAuctionById } from "./getAuction";
import { uploadPicturetoS3 } from "../lib/uploadPictureToS3";
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import createHttpError from "http-errors";

export async function uploadAuctionPicture(event){

    const { id } = event.pathParameters;
    const auction = await getAuctionById(id);
    const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    try{
    const uploadToS3Result = await uploadPicturetoS3(auction.id+'.jpg', buffer);
    console.log(uploadToS3Result);
    }catch(error){
        console.error(error);
        throw new createHttpError.InternalServerError(error);
    }


    return{
        statusCode: 200,
        body: JSON.stringify({}),
    };

}

export const handler = middy(uploadAuctionPicture)
    ,use(httpErrorHandler());