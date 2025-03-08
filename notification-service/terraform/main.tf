terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.90"
    }
  }
  required_version = ">= 1.2.0"
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
    }
  }
}

# Create deployment package
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "../dist/sendMail.js"
  output_path = "../dist/function.zip"
}

# Lambda function
resource "aws_lambda_function" "send_mail" {
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  function_name    = "${var.project_name}-send-mail-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "sendMail.handler"
  runtime         = "nodejs22.x"
  memory_size     = 256
  architectures   = ["arm64"]
  publish         = true

  environment {
    variables = {
      ENVIRONMENT = var.environment
      NODE_OPTIONS = "--enable-source-maps"
    }
  }

  depends_on = [aws_iam_role_policy.lambda_policy]

  tracing_config {
    mode = "Active"
  }
}

# SQS Queue
resource "aws_sqs_queue" "mail_queue" {
  name = "${var.project_name}-mail-queue-${var.environment}"
}

# Lambda SQS trigger
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.mail_queue.arn
  function_name    = aws_lambda_function.send_mail.arn
  batch_size       = 1
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Lambda to access SES and CloudWatch Logs
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy-${var.environment}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.mail_queue.arn
      }
    ]
  })
}
