# Lambda module
variable "stage" {
  description = "Deployment stage"
  type        = string
}

variable "auth0_public_key" {
  description = "Auth0 Public Key content from secret.pem"
  type        = string
  sensitive   = true
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "auth_service_lambda_role_${var.stage}"

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

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Functions
resource "aws_lambda_function" "auth" {
  filename         = data.archive_file.auth_lambda.output_path
  function_name    = "auth-service-auth-${var.stage}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "dist/auth.handler"
  runtime         = "nodejs22.x"
  memory_size     = 256
  architectures   = ["arm64"]

  environment {
    variables = {
      NODE_OPTIONS = "--enable-source-maps --experimental-specifier-resolution=node"
      AUTH0_PUBLIC_KEY = var.auth0_public_key
    }
  }
}

resource "aws_lambda_function" "public_endpoint" {
  filename         = data.archive_file.public_lambda.output_path
  function_name    = "auth-service-public-${var.stage}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "dist/public.handler"
  runtime         = "nodejs22.x"
  memory_size     = 256
  architectures   = ["arm64"]

  environment {
    variables = {
      NODE_OPTIONS = "--enable-source-maps --experimental-specifier-resolution=node"
    }
  }
}

resource "aws_lambda_function" "private_endpoint" {
  filename         = data.archive_file.private_lambda.output_path
  function_name    = "auth-service-private-${var.stage}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "dist/private.handler"
  runtime         = "nodejs22.x"
  memory_size     = 256
  architectures   = ["arm64"]

  environment {
    variables = {
      NODE_OPTIONS = "--enable-source-maps --experimental-specifier-resolution=node"
    }
  }
}

# Lambda source code archives
data "archive_file" "auth_lambda" {
  type        = "zip"
  source_dir  = "${path.root}/../"
  output_path = "${path.module}/files/auth.zip"
  excludes    = ["node_modules", "terraform", ".git"]
}

data "archive_file" "public_lambda" {
  type        = "zip"
  source_dir  = "${path.root}/../"
  output_path = "${path.module}/files/public.zip"
  excludes    = ["node_modules", "terraform", ".git"]
}

data "archive_file" "private_lambda" {
  type        = "zip"
  source_dir  = "${path.root}/../"
  output_path = "${path.module}/files/private.zip"
  excludes    = ["node_modules", "terraform", ".git"]
}
