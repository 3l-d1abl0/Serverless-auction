const schema = {
    type: 'object',
    required: ['body'],
    properties: {
        body: {
            type: 'string',
            minLength: 1,
            pattern: '\=$'
        },
    },
} as const;

export default schema;
