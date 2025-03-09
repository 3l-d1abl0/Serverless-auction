resource "aws_dynamodb_table" "auctions" {
  name           = "AuctionsTable-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  
  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "endingAt"
    type = "S"
  }

  global_secondary_index {
    name               = "statusAndEndDate"
    hash_key          = "status"
    range_key         = "endingAt"
    projection_type   = "ALL"
  }

  tags = local.common_tags
}
