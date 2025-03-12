import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Auction } from '../types/auction';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient({});

export async function closeAuction(auction: Auction): Promise<void> {
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id: auction.id },
        UpdateExpression: 'set #status = :status',
        ExpressionAttributeValues: {
            ':status': 'CLOSED',
        },
        ExpressionAttributeNames: {
            '#status': 'status',
        }
    };

    await docClient.send(new UpdateCommand(params));

    const { title, seller, highestBid } = auction;
    const { amount, bidder } = highestBid;

    if (amount === 0) {
        await sqsClient.send(new SendMessageCommand({
            QueueUrl: process.env.MAIL_QUEUE_URL,
            MessageBody: JSON.stringify({
                subject: 'No one bid on your Auction ! !',
                recipient: seller,
                body: `No one bid on your Item "${title}" ! Good Luck next Time !`,
            }),
        }));
        return;
    }

    if (!bidder) {
        throw new Error('Bidder information is missing');
    }

    const notifySeller = sqsClient.send(new SendMessageCommand({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
            subject: 'SOLD !',
            recipient: seller,
            body: `Wohooo! Your item "${title}" has been sold for $${amount}`,
        }),
    }));

    const notifyBidder = sqsClient.send(new SendMessageCommand({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
            subject: 'Auction Won !',
            recipient: bidder,
            body: `You won ${title} for $${amount}`,
        }),
    }));

    await Promise.all([notifyBidder, notifySeller]);
}
