################################################################################
# DynamoDB — User Mappings
################################################################################
resource "aws_dynamodb_table" "user_mappings" {
  name         = "${var.project}-user-mappings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "slack_user_id"

  attribute {
    name = "slack_user_id"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = false
  }

  point_in_time_recovery {
    enabled = var.enable_pitr
  }

  tags = merge(var.common_tags, {
    Name = "${var.project}-user-mappings"
  })
}

################################################################################
# DynamoDB — Terraform State Lock
################################################################################
resource "aws_dynamodb_table" "terraform_lock" {
  count = var.create_state_backend ? 1 : 0

  name         = "${var.project}-terraform-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(var.common_tags, {
    Name = "${var.project}-terraform-lock"
  })
}

################################################################################
# S3 — Terraform State
################################################################################
resource "aws_s3_bucket" "terraform_state" {
  count = var.create_state_backend ? 1 : 0

  bucket = "${var.project}-terraform-state-${var.aws_account_id}"

  tags = merge(var.common_tags, {
    Name = "${var.project}-terraform-state"
  })
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  count  = var.create_state_backend ? 1 : 0
  bucket = aws_s3_bucket.terraform_state[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  count  = var.create_state_backend ? 1 : 0
  bucket = aws_s3_bucket.terraform_state[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  count  = var.create_state_backend ? 1 : 0
  bucket = aws_s3_bucket.terraform_state[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

################################################################################
# Populate DynamoDB with user mappings from Terraform
################################################################################
resource "aws_dynamodb_table_item" "user_mapping" {
  for_each = var.user_instance_map

  table_name = aws_dynamodb_table.user_mappings.name
  hash_key   = aws_dynamodb_table.user_mappings.hash_key

  item = jsonencode({
    slack_user_id = { S = each.key }
    user_id       = { S = each.value.user_id }
    instance_id   = { S = each.value.instance_id }
    instance_ip   = { S = each.value.instance_ip }
    openclaw_port = { N = tostring(each.value.openclaw_port) }
    status        = { S = "active" }
    created_at    = { S = timestamp() }
  })

  lifecycle {
    ignore_changes = [item]
  }
}
