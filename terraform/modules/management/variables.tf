variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_id" {
  description = "Public subnet for the management instance"
  type        = string
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "ami_id" {
  description = "Amazon Linux 2023 AMI or similar"
  type        = string
}

variable "key_name" {
  type    = string
  default = ""
}

variable "admin_cidr" {
  description = "CIDR allowed to access dashboard (e.g. your IP)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "api_port" {
  type    = number
  default = 3001
}

variable "dashboard_port" {
  type    = number
  default = 3000
}

variable "acm_certificate_arn" {
  description = "ACM cert ARN for HTTPS. If empty, ALB uses HTTP only."
  type        = string
  default     = ""
}

variable "common_tags" {
  type    = map(string)
  default = {}
}
