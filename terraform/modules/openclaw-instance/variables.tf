variable "project" {
  type    = string
  default = "openclaw"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "user_id" {
  type = string
}

variable "slack_user_id" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "model" {
  type    = string
  default = "claude-sonnet"
}

variable "ami_id" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "security_group_id" {
  type = string
}

variable "instance_profile_name" {
  type = string
}

variable "key_name" {
  type    = string
  default = ""
}

variable "ebs_volume_size" {
  type    = number
  default = 30
}

variable "detailed_monitoring" {
  type    = bool
  default = false
}

variable "openclaw_port" {
  type    = number
  default = 3000
}

variable "auto_stop" {
  type    = bool
  default = true
}

variable "common_tags" {
  type    = map(string)
  default = {}
}
