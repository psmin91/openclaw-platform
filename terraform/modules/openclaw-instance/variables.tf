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

variable "ami_id" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "security_group" {
  type = string
}

variable "key_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
