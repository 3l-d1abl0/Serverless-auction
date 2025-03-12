export const placeBidSchema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        amount: { type: 'number' }
      },
      required: ['amount']
    }
  },
  required: ['body']
} as const;

export default placeBidSchema;