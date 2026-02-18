variable "project" {
  type = string
}

variable "aws_account_id" {
  type    = string
  default = ""
}

variable "enable_pitr" {
  type    = bool
  default = false
}

variable "create_state_backend" {
  type    = bool
  default = false
}

variable "user_instance_map" {
  description = "Map of slack_user_id → instance details for DynamoDB seeding"
  type = map(object({
    user_id       = string
    instance_id   = string
    instance_ip   = string
    openclaw_port = number
  }))
  default = {}
}

variable "common_tags" {
  type    = map(string)
  default = {}
}
