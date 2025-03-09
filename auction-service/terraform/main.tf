terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.90"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
  required_version = ">= 1.2.0"
}

provider "aws" {
  region = var.aws_region
}

provider "random" {}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local variables
locals {
  service_name = "auction-service"
  lambda_runtime = "nodejs22.x"
  handlers = [
    "createAuction",
    "getAuctions",
    "getAuction",
    "placeBid",
    "uploadAuctionPicture",
    "processAuctions"
  ]
  
  # Mail Queue configuration
  notification_queue_name = "notification-service-mail-queue-${var.environment}"
  mail_queue_arn = "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.notification_queue_name}"
  mail_queue_url = "https://sqs.${data.aws_region.current.name}.amazonaws.com/${data.aws_caller_identity.current.account_id}/${local.notification_queue_name}"

  # Common tags
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      Service     = local.service_name
    }
  )
}
