variable "project" {
  type = string
}

variable "aws_region" {
  type = string
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
  default = true
}

variable "enable_vpc_endpoints" {
  type    = bool
  default = false
}

variable "vpc_endpoint_sg_id" {
  type    = string
  default = ""
}

variable "common_tags" {
  type    = map(string)
  default = {}
}
