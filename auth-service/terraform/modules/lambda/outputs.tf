output "api_url" {
  description = "Base URL for the API Gateway stage"
  value       = aws_api_gateway_stage.api.invoke_url
}

output "public_endpoint_url" {
  description = "URL for the public endpoint that doesn't require authentication"
  value       = "${aws_api_gateway_stage.api.invoke_url}/public"
}

output "private_endpoint_url" {
  description = "URL for the private endpoint that requires JWT authentication"
  value       = "${aws_api_gateway_stage.api.invoke_url}/private"
}
