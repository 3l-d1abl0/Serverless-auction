# Auction Service Terraform Infrastructure

This Terraform configuration replicates the serverless framework setup for the Auction Service, maintaining feature parity while using native AWS services.

## Infrastructure Components

### Lambda Functions
- All TypeScript handlers from `src/handlers/` are deployed as Lambda functions
- Runtime: Node.js 22.x
- Memory: 256MB
- Source maps enabled via NODE_OPTIONS environment variable
- Environment variables for DynamoDB, S3, and Mail Queue

### DynamoDB
- Table: `AuctionsTable-{environment}`
- Billing: Pay-per-request
- GSI: `statusAndEndDate` for querying auctions by status and end date

### S3 Bucket
- Bucket: `auctions-bucket-{random-suffix}-{environment}`
- Random 8-character suffix to ensure global uniqueness
- Public access configuration:
  - Public read access enabled
  - Block public access settings disabled
  - BucketOwnerPreferred ownership
- Lifecycle rule: Expires objects after 1 day

Note: The S3 bucket is configured to allow public read access for auction pictures. This is required for the auction service to function properly. The configuration includes:
1. Disabled block public access settings
2. BucketOwnerPreferred ownership controls
3. Public read policy for GetObject actions
4. Proper resource dependencies to ensure correct configuration order

### API Gateway (HTTP API)
- CORS enabled
- Lambda authorizer from auth-service
  - Type: REQUEST
  - Identity source: Authorization header
  - Default ARN: `arn:aws:lambda:ap-south-1:127214154704:function:auth-service-auth-dev`
  - Payload format version: 2.0 (HTTP API standard)
  - Simple responses enabled for easier integration
- Protected routes:
  - POST /auction (createAuction)
  - GET /auctions (getAuctions)
  - GET /auction/{id} (getAuction)
  - PATCH /auction/{id}/bid (placeBid)
  - PATCH /auction/{id}/picture (uploadAuctionPicture)
- Unprotected routes:
  - None (all routes require authorization)

### EventBridge
- Schedule: Every 1 minute
- Triggers: processAuctions Lambda function

### Mail Queue Integration
The Mail Queue ARN and URL are automatically constructed using:
- Account ID (from AWS provider)
- Region (from AWS provider)
- Environment (from variables)
- Queue name format: `notification-service-mail-queue-{environment}`

Example formats:
- ARN: `arn:aws:sqs:{region}:{account_id}:notification-service-mail-queue-{environment}`
- URL: `https://sqs.{region}.amazonaws.com/{account_id}/notification-service-mail-queue-{environment}`

## Prerequisites

1. AWS Provider version ~> 5.90
2. Terraform version >= 1.2.0
3. Node.js 22.x
4. Auth service Lambda ARN

## Build Process

1. TypeScript type checking:
   ```bash
   npm run typecheck
   ```

2. Bundle handlers with esbuild:
   ```bash
   npm run build
   ```

The build process:
- Runs type checking first
- Bundles each handler into its own directory
- Enables source maps via NODE_OPTIONS environment variable
- Handles external dependencies properly
- Injects environment-specific configuration

## Deployment

1. Initialize Terraform:
   ```bash
   terraform init
   ```

2. Set variables:
   ```bash
   # For dev environment
   terraform plan \
     -var="environment=dev" \
     -var="auth_lambda_arn=<auth_lambda_arn>"
   ```

3. Apply infrastructure:
   ```bash
   terraform apply \
     -var="environment=dev" \
     -var="auth_lambda_arn=<auth_lambda_arn>"
   ```

## Outputs

After deployment, Terraform will output:

- `api_endpoint`: Base URL for the API Gateway
- `function_names`: Map of all deployed Lambda function names
- `dynamodb_table`: Name of the DynamoDB table
- `s3_bucket`: Name of the S3 bucket for auction pictures
- `s3_bucket_random_suffix`: Random suffix used in bucket name
- `mail_queue`: ARN and URL of the Mail Queue (marked sensitive)

View outputs:
```bash
terraform output
# View bucket name with random suffix
terraform output s3_bucket
# For sensitive values
terraform output mail_queue
```

## Required Variables

- `environment` - Environment name (e.g., dev, prod)
  - Default: `dev`
- `auth_lambda_arn` - ARN of the auth service Lambda authorizer
  - Default: `arn:aws:lambda:ap-south-1:127214154704:function:auth-service-auth-dev`
- `aws_region` - AWS region
  - Default: `ap-south-1`

## Migration Notes

This Terraform configuration maintains feature parity with the serverless framework setup while providing:
- Native AWS service configurations
- Fine-grained IAM permissions
- Explicit resource dependencies
- Infrastructure as Code best practices
- TypeScript support with source maps via environment variables
- Automatic builds and type checking
