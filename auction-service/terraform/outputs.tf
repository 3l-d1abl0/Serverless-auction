output "api_endpoint" {
  description = "Base URL for API Gateway stage"
  value       = aws_apigatewayv2_api.auctions.api_endpoint
}

output "api_stage" {
  description = "API Gateway stage details"
  value = {
    name = aws_apigatewayv2_stage.auctions.name
    id   = aws_apigatewayv2_stage.auctions.id
    url  = aws_apigatewayv2_stage.auctions.invoke_url
  }
}

output "api_routes" {
  description = "API Gateway routes"
  value = {
    create_auction   = "POST /auction"
    get_auctions     = "GET /auctions"
    get_auction      = "GET /auction/{id}"
    place_bid        = "PATCH /auction/{id}/bid"
    upload_picture   = "PATCH /auction/{id}/picture"
  }
}

output "lambda_functions" {
  description = "Lambda function details"
  value = {
    for name, lambda in aws_lambda_function.handlers : name => {
      name        = lambda.function_name
      arn         = lambda.arn
      invoke_arn  = lambda.invoke_arn
      runtime     = lambda.runtime
      memory_size = lambda.memory_size
      timeout     = lambda.timeout
    }
  }
}

output "lambda_role" {
  description = "IAM role used by Lambda functions"
  value = {
    name = aws_iam_role.lambda_role.name
    arn  = aws_iam_role.lambda_role.arn
  }
}

output "dynamodb_table" {
  description = "DynamoDB table details"
  value = {
    name           = aws_dynamodb_table.auctions.name
    arn            = aws_dynamodb_table.auctions.arn
    billing_mode   = aws_dynamodb_table.auctions.billing_mode
    hash_key       = aws_dynamodb_table.auctions.hash_key
    global_indexes = [for idx in aws_dynamodb_table.auctions.global_secondary_index : {
      name            = idx.name
      hash_key        = idx.hash_key
      range_key       = idx.range_key
      projection_type = idx.projection_type
    }]
  }
}

output "s3_bucket" {
  description = "S3 bucket details"
  value = {
    name          = aws_s3_bucket.auctions.id
    arn           = aws_s3_bucket.auctions.arn
    region        = aws_s3_bucket.auctions.region
    domain_name   = aws_s3_bucket.auctions.bucket_domain_name
  }
}

output "s3_bucket_random_suffix" {
  description = "Random suffix used in S3 bucket name"
  value       = random_string.bucket_suffix.result
}

output "eventbridge_rule" {
  description = "EventBridge rule for processing auctions"
  value = {
    name                = aws_cloudwatch_event_rule.process_auctions.name
    arn                 = aws_cloudwatch_event_rule.process_auctions.arn
    schedule_expression = aws_cloudwatch_event_rule.process_auctions.schedule_expression
    target_function     = aws_lambda_function.handlers["processAuctions"].function_name
  }
}

output "mail_queue" {
  description = "Mail Queue configuration"
  value = {
    name = local.notification_queue_name
    arn  = local.mail_queue_arn
    url  = local.mail_queue_url
  }
  sensitive = true
}

output "authorizer" {
  description = "Lambda authorizer configuration"
  value = {
    id            = aws_apigatewayv2_authorizer.auctions.id
    name          = aws_apigatewayv2_authorizer.auctions.name
    authorizer_arn = var.auth_lambda_arn
  }
}

output "service_info" {
  description = "General service information"
  value = {
    name        = local.service_name
    environment = var.environment
    region      = data.aws_region.current.name
    account_id  = data.aws_caller_identity.current.account_id
  }
}
