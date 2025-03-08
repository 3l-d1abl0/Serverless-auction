variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Environment (dev/prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name to be used in resource names"
  type        = string
  default     = "notification-service"
}
