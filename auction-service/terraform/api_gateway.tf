resource "aws_apigatewayv2_api" "auctions" {
  name          = "${local.service_name}-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["Content-Type", "Authorization"]
    allow_methods = ["GET", "POST", "PATCH"]
    allow_origins = ["*"]
  }

  tags = local.common_tags
}

resource "aws_apigatewayv2_stage" "auctions" {
  api_id      = aws_apigatewayv2_api.auctions.id
  name        = var.environment
  auto_deploy = true

  tags = local.common_tags
}

# Lambda authorizer
resource "aws_apigatewayv2_authorizer" "auctions" {
  api_id           = aws_apigatewayv2_api.auctions.id
  authorizer_type  = "REQUEST"
  authorizer_uri   = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.auth_lambda_arn}/invocations"
  identity_sources = ["$request.header.Authorization"]
  name            = "lambda-authorizer"
  
  # Required for HTTP APIs with REQUEST authorizer
  authorizer_payload_format_version = "2.0"
  enable_simple_responses          = true
}

# Routes and integrations
resource "aws_apigatewayv2_integration" "auctions" {
  for_each = toset(local.handlers)

  api_id                 = aws_apigatewayv2_api.auctions.id
  integration_type       = "AWS_PROXY"
  integration_uri       = aws_lambda_function.handlers[each.value].invoke_arn
  payload_format_version = "2.0"
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  for_each = toset(local.handlers)

  statement_id  = "AllowAPIGatewayInvoke-${each.value}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.handlers[each.value].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.auctions.execution_arn}/*/*"
}

# Add permission for API Gateway to invoke the authorizer Lambda
resource "aws_lambda_permission" "authorizer" {
  statement_id  = "AllowAPIGatewayInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = var.auth_lambda_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.auctions.execution_arn}/authorizers/*"
}

# Routes
resource "aws_apigatewayv2_route" "create_auction" {
  api_id    = aws_apigatewayv2_api.auctions.id
  route_key = "POST /auction"

  target = "integrations/${aws_apigatewayv2_integration.auctions["createAuction"].id}"
  authorization_type = "CUSTOM"
  authorizer_id     = aws_apigatewayv2_authorizer.auctions.id
}

resource "aws_apigatewayv2_route" "get_auctions" {
  api_id    = aws_apigatewayv2_api.auctions.id
  route_key = "GET /auctions"

  target = "integrations/${aws_apigatewayv2_integration.auctions["getAuctions"].id}"
  authorization_type = "CUSTOM"
  authorizer_id     = aws_apigatewayv2_authorizer.auctions.id
}

resource "aws_apigatewayv2_route" "get_auction" {
  api_id    = aws_apigatewayv2_api.auctions.id
  route_key = "GET /auction/{id}"

  target = "integrations/${aws_apigatewayv2_integration.auctions["getAuction"].id}"
  authorization_type = "CUSTOM"
  authorizer_id     = aws_apigatewayv2_authorizer.auctions.id
}

resource "aws_apigatewayv2_route" "place_bid" {
  api_id    = aws_apigatewayv2_api.auctions.id
  route_key = "PATCH /auction/{id}/bid"

  target = "integrations/${aws_apigatewayv2_integration.auctions["placeBid"].id}"
  authorization_type = "CUSTOM"
  authorizer_id     = aws_apigatewayv2_authorizer.auctions.id
}

resource "aws_apigatewayv2_route" "upload_picture" {
  api_id    = aws_apigatewayv2_api.auctions.id
  route_key = "PATCH /auction/{id}/picture"

  target = "integrations/${aws_apigatewayv2_integration.auctions["uploadAuctionPicture"].id}"
  authorization_type = "CUSTOM"
  authorizer_id     = aws_apigatewayv2_authorizer.auctions.id
}
