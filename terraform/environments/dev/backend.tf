# Uncomment after bootstrapping the state backend (run storage module first)
# terraform {
#   backend "s3" {
#     bucket         = "openclaw-terraform-state-ACCOUNT_ID"
#     key            = "dev/terraform.tfstate"
#     region         = "ap-northeast-2"
#     dynamodb_table = "openclaw-terraform-lock"
#     encrypt        = true
#   }
# }
