# Generate random suffix for bucket name
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket" "auctions" {
  #bucket = "auctions-bucket-qwestringdgs-${var.environment}"
  bucket = "auctions-bucket-${random_string.bucket_suffix.result}-${var.environment}"

  tags = local.common_tags
}

# Disable block public access settings
resource "aws_s3_bucket_public_access_block" "auctions" {
  bucket = aws_s3_bucket.auctions.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Configure bucket ownership
resource "aws_s3_bucket_ownership_controls" "auctions" {
  bucket = aws_s3_bucket.auctions.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# Add lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "auctions" {
  # Wait for public access and ownership settings
  depends_on = [
    aws_s3_bucket_public_access_block.auctions,
    aws_s3_bucket_ownership_controls.auctions
  ]

  bucket = aws_s3_bucket.auctions.id

  rule {
    id     = "ExpirePictures"
    status = "Enabled"

    expiration {
      days = var.auction_picture_expiry_days
    }
  }
}

# Add bucket policy for public read access
resource "aws_s3_bucket_policy" "auctions" {
  # Wait for public access and ownership settings
  depends_on = [
    aws_s3_bucket_public_access_block.auctions,
    aws_s3_bucket_ownership_controls.auctions
  ]

  bucket = aws_s3_bucket.auctions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicRead"
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:GetObject"]
        Resource  = ["${aws_s3_bucket.auctions.arn}/*"]
      }
    ]
  })
}
