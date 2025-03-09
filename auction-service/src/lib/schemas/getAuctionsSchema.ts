const getAuctionsSchema = {
  type: 'object',
  properties: {
    queryStringParameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['OPEN', 'CLOSED'],
          default: 'OPEN'
        }
      }
    }
  }
} as const;

export default getAuctionsSchema;
