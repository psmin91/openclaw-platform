variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "admin_cidr" {
  type    = string
  default = ""
}

variable "common_tags" {
  type    = map(string)
  default = {}
}
