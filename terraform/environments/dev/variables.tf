variable "aws_region" {
  type    = string
  default = "ap-northeast-2"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "az_count" {
  type    = number
  default = 2
}

variable "enable_nat_gateway" {
  type    = bool
  default = false
  description = "Enable NAT Gateway. Set false for dev to save costs."
}

variable "use_public_subnets_for_instances" {
  type    = bool
  default = true
  description = "Place EC2 instances in public subnets (dev cost optimization). In prod, use private subnets + NAT."
}

variable "enable_vpc_endpoints" {
  type    = bool
  default = false
}

variable "admin_cidr" {
  type    = string
  default = ""
}

variable "openclaw_ami_id" {
  type = string
}

variable "management_ami_id" {
  type        = string
  default     = ""
  description = "AMI for management instance (Amazon Linux 2023). If empty, uses openclaw_ami_id."
}

variable "key_name" {
  type    = string
  default = ""
}

variable "users" {
  description = "User configurations — add users here"
  type = map(object({
    slack_user_id = string
    instance_type = string
    model         = optional(string, "claude-sonnet")
    ebs_size      = optional(number, 30)
    port          = optional(number, 3000)
    auto_stop     = optional(bool, true)
  }))
}

variable "slack_signing_secret" {
  type      = string
  sensitive = true
}

variable "slack_bot_token" {
  type      = string
  sensitive = true
}

variable "lambda_in_vpc" {
  type    = bool
  default = true
}

variable "create_state_backend" {
  type    = bool
  default = false
}

variable "autostop_schedule" {
  type    = string
  default = "cron(0 15 * * ? *)" # 00:00 KST
}

variable "alert_email" {
  type    = string
  default = ""
}
