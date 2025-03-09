variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
  default     = "dev"
}

variable "auth_lambda_arn" {
  description = "ARN of the auth service Lambda authorizer"
  type        = string
  default     = "arn:aws:lambda:ap-south-1:127214154704:function:auth-service-auth-dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "lambda_memory" {
  description = "Memory allocation for Lambda functions (MB)"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions (seconds)"
  type        = number
  default     = 30
}

variable "auction_picture_expiry_days" {
  description = "Number of days after which auction pictures expire"
  type        = number
  default     = 1
}

variable "process_auctions_schedule" {
  description = "Schedule expression for processing auctions"
  type        = string
  default     = "rate(1 minute)"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {
    Project     = "auction-service"
    ManagedBy   = "terraform"
    Environment = "dev"
  }
}
