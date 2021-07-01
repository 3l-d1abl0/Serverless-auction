import AWS from 'aws-sdk';
/*import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import htpErrorHandler from '@middy/http-error-handler';*/
import createError from 'http-errors';
import validator from '@middy/validator';
import getAuctionsSchema from '../lib/schemas/getAuctionsSchema';
import commonMiddleware from '../lib/commonMiddleware';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {

  const { status } = event.queryStringParameters;

  let auctions;

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndDate',
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeValues:{
      ':status': status,
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    }
  };

  try{

    const result = await dynamodb.query(params).promise();

    auctions = result.Items;
  }catch(error){

    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}

/*
export const handler = middy(getAuctions)
.use(httpJsonBodyParser())
.use(httpEventNormalizer())
.use(htpErrorHandler());
*/

export const handler = commonMiddleware(getAuctions)
.use(validator({ inputSchema: getAuctionsSchema, useDefaults: true }));


