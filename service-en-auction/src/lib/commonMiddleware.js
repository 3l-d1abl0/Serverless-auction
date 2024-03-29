import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import htpErrorHandler from '@middy/http-error-handler';
import cors from '@middy/http-cors';

export default handler => middy(handler)
.use([
    httpJsonBodyParser(),
    httpEventNormalizer(),
    htpErrorHandler(),
    cors(),
]);