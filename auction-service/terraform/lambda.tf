data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_role" {
  name = "${local.service_name}-lambda-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = local.common_tags
}

# DynamoDB permissions
resource "aws_iam_role_policy" "dynamodb" {
  name = "dynamodb-access"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.auctions.arn,
          "${aws_dynamodb_table.auctions.arn}/index/statusAndEndDate"
        ]
      }
    ]
  })
}

# S3 permissions
resource "aws_iam_role_policy" "s3" {
  name = "s3-access"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = ["${aws_s3_bucket.auctions.arn}/*"]
      }
    ]
  })
}

# CloudWatch Logs permissions
resource "aws_iam_role_policy" "cloudwatch" {
  name = "cloudwatch-access"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = ["arn:aws:logs:*:*:*"]
      }
    ]
  })
}

# SQS permissions for Mail Queue
resource "aws_iam_role_policy" "sqs" {
  name = "sqs-access"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["sqs:SendMessage"]
        Resource = [local.mail_queue_arn]
      }
    ]
  })
}

# CloudWatch Log Groups for Lambda functions
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = toset(local.handlers)

  name              = "/aws/lambda/${local.service_name}-${var.environment}-${each.value}"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

# Lambda functions
resource "aws_lambda_function" "handlers" {
  for_each = toset(local.handlers)

  filename         = "${path.module}/../dist-zip/${each.value}.zip"
  function_name    = "${local.service_name}-${var.environment}-${each.value}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = local.lambda_runtime
  memory_size     = var.lambda_memory
  timeout         = var.lambda_timeout
  package_type    = "Zip"

  environment {
    variables = {
      AUCTIONS_TABLE_NAME = aws_dynamodb_table.auctions.name
      AUCTIONS_BUCKET_NAME = aws_s3_bucket.auctions.id
      MAIL_QUEUE_URL = local.mail_queue_url
      NODE_OPTIONS = "--enable-source-maps --experimental-specifier-resolution=node"
    }
  }

  depends_on = [
    aws_iam_role_policy.dynamodb,
    aws_iam_role_policy.s3,
    aws_iam_role_policy.cloudwatch,
    aws_iam_role_policy.sqs,
    aws_cloudwatch_log_group.lambda_logs,
    null_resource.build_typescript
  ]

  tags = local.common_tags
}
