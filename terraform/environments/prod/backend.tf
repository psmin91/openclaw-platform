# terraform {
#   backend "s3" {
#     bucket         = "openclaw-terraform-state-ACCOUNT_ID"
#     key            = "prod/terraform.tfstate"
#     region         = "ap-northeast-2"
#     dynamodb_table = "openclaw-terraform-lock"
#     encrypt        = true
#   }
# }
