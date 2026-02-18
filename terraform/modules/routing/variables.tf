variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "lambda_source_dir" {
  type = string
}

variable "lambda_role_arn" {
  type = string
}

variable "lambda_in_vpc" {
  type    = bool
  default = true
}

variable "subnet_ids" {
  type    = list(string)
  default = []
}

variable "lambda_sg_id" {
  type    = string
  default = ""
}

variable "dynamodb_table_name" {
  type = string
}

variable "slack_signing_secret" {
  type      = string
  sensitive = true
}

variable "slack_bot_token" {
  type      = string
  sensitive = true
}

variable "openclaw_port" {
  type    = number
  default = 3000
}

variable "common_tags" {
  type    = map(string)
  default = {}
}
