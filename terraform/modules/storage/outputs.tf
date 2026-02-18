output "user_mappings_table_name" {
  value = aws_dynamodb_table.user_mappings.name
}

output "user_mappings_table_arn" {
  value = aws_dynamodb_table.user_mappings.arn
}

output "state_bucket_name" {
  value = var.create_state_backend ? aws_s3_bucket.terraform_state[0].id : null
}

output "state_lock_table_name" {
  value = var.create_state_backend ? aws_dynamodb_table.terraform_lock[0].name : null
}
