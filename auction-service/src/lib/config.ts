export const config = {
  AUCTIONS_TABLE_NAME: process.env.AUCTIONS_TABLE_NAME || '',
  AUCTIONS_BUCKET_NAME: process.env.AUCTIONS_BUCKET_NAME || '',
  MAIL_QUEUE_URL: process.env.MAIL_QUEUE_URL || '',
};

// Validate required environment variables
if (!config.AUCTIONS_TABLE_NAME) {
  throw new Error('AUCTIONS_TABLE_NAME is required');
}

if (!config.AUCTIONS_BUCKET_NAME) {
  throw new Error('AUCTIONS_BUCKET_NAME is required');
}

if (!config.MAIL_QUEUE_URL) {
  throw new Error('MAIL_QUEUE_URL is required');
}

export default config;
