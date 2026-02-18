variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "autostop_role_arn" {
  type = string
}

variable "autostop_schedule" {
  type    = string
  default = "cron(0 15 * * ? *)" # 00:00 KST (15:00 UTC)
}

variable "alert_email" {
  type    = string
  default = ""
}

variable "slack_router_function_name" {
  type    = string
  default = ""
}

variable "common_tags" {
  type    = map(string)
  default = {}
}
