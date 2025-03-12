import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import CreateError from '../lib/errors';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Auction } from '../types/auction';
import config from '../lib/config';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sqs = new SQSClient({});

const processAuctions = async () => {
    try {
        const now = new Date();
        
        // Query for auctions that should be closed
        const queryParams = {
            TableName: config.AUCTIONS_TABLE_NAME,
            IndexName: 'statusAndEndDate',
            KeyConditionExpression: '#status = :status AND endingAt <= :now',
            ExpressionAttributeValues: {
                ':status': 'OPEN',
                ':now': now.toISOString(),
            },
            ExpressionAttributeNames: {
                '#status': 'status',
            },
        };

        const result = await docClient.send(new QueryCommand(queryParams));
        const auctionsToClose = result.Items as Auction[];
        
        if (!auctionsToClose.length) {
            return { closed: 0 };
        }

        console.log(`Found ${auctionsToClose.length} auctions to close`);
        
        // Close each auction and notify if there was a bidder
        const closePromises = auctionsToClose.map(auction => closeAuction(auction));
        await Promise.all(closePromises);
        
        return { closed: auctionsToClose.length };
    } catch (error) {
        console.error(error);
        throw CreateError.InternalServerError((error as Error).message);
    }
};

async function closeAuction(auction: Auction) {
    const params = {
        TableName: config.AUCTIONS_TABLE_NAME,
        Key: { id: auction.id },
        UpdateExpression: 'set #status = :status',
        ExpressionAttributeValues: {
            ':status': 'CLOSED',
        },
        ExpressionAttributeNames: {
            '#status': 'status',
        },
    };

    await docClient.send(new UpdateCommand(params));
    
    // If there was a bidder, send notification
    if (auction.highestBid.bidder) {
        const { title, seller, highestBid } = auction;
        const { amount, bidder } = highestBid;
        
        const notifParams = {
            QueueUrl: config.MAIL_QUEUE_URL,
            MessageBody: JSON.stringify({
                subject: 'Your auction has been closed!',
                recipient: seller,
                body: `Your item "${title}" has been sold for $${amount} to ${bidder}`,
            }),
        };
        
        await sqs.send(new SendMessageCommand(notifParams));
        
        const bidderNotifParams = {
            QueueUrl: config.MAIL_QUEUE_URL,
            MessageBody: JSON.stringify({
                subject: 'You won an auction!',
                recipient: bidder,
                body: `You won the auction for "${title}" with a bid of $${amount}`,
            }),
        };
        
        await sqs.send(new SendMessageCommand(bidderNotifParams));
    } else {
        // No bids, notify seller
        const { title, seller } = auction;
        
        const notifParams = {
            QueueUrl: config.MAIL_QUEUE_URL,
            MessageBody: JSON.stringify({
                subject: 'Your auction has ended',
                recipient: seller,
                body: `Your item "${title}" didn't get any bids and has been closed.`,
            }),
        };
        
        await sqs.send(new SendMessageCommand(notifParams));
    }
}

export const handler = processAuctions;
