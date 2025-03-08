output "api_url" {
  description = "Base URL of the API Gateway"
  value       = module.lambda_functions.api_url
}

output "public_endpoint_url" {
  description = "URL for the public endpoint"
  value       = module.lambda_functions.public_endpoint_url
}

output "private_endpoint_url" {
  description = "URL for the private endpoint"
  value       = module.lambda_functions.private_endpoint_url
}
