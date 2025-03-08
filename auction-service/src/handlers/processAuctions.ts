import { getEndedAuctions } from '../lib/getEndedAuctions.js';
import createError from 'http-errors';
import { closeAuction } from '../lib/closeAuction.js';
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

const processAuctions: APIGatewayProxyHandler = async (): Promise<APIGatewayProxyResult> => {
    try {
        const auctionsToClose = await getEndedAuctions();
        console.log('Auctions to close:', auctionsToClose);
        const closePromises = auctionsToClose.map(auction => closeAuction(auction));
        await Promise.all(closePromises);

        return {
            statusCode: 200,
            body: JSON.stringify({ closed: closePromises.length })
        };
    } catch (error) {
        console.error('Error processing auctions:', error);
        throw new createError.InternalServerError((error as Error).message);
    }
}

export const handler = processAuctions;
