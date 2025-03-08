import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});

export async function uploadPicturetoS3(key: string, body: Buffer): Promise<string> {
    const result = await s3Client.send(new PutObjectCommand({
        Bucket: process.env.AUCTIONS_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg',
    }));

    return `https://${process.env.AUCTIONS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
}
