terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.90"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

# Variables
variable "stage" {
  description = "Deployment stage"
  type        = string
  default     = "dev"
}

# Read Auth0 public key from file
data "local_file" "auth0_public_key" {
  filename = "${path.root}/../secret.pem"
}

# Lambda Functions
module "lambda_functions" {
  source = "./modules/lambda"

  stage            = var.stage
  auth0_public_key = data.local_file.auth0_public_key.content
}
