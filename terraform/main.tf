terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "openclaw" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name    = "openclaw-vpc"
    Project = "openclaw-platform"
  }
}

resource "aws_subnet" "openclaw" {
  vpc_id                  = aws_vpc.openclaw.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "openclaw-subnet"
  }
}

resource "aws_internet_gateway" "openclaw" {
  vpc_id = aws_vpc.openclaw.id
  tags   = { Name = "openclaw-igw" }
}

resource "aws_route_table" "openclaw" {
  vpc_id = aws_vpc.openclaw.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.openclaw.id
  }
  tags = { Name = "openclaw-rt" }
}

resource "aws_route_table_association" "openclaw" {
  subnet_id      = aws_subnet.openclaw.id
  route_table_id = aws_route_table.openclaw.id
}

# Security Group
resource "aws_security_group" "openclaw_instance" {
  name_prefix = "openclaw-instance-"
  vpc_id      = aws_vpc.openclaw.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "openclaw-instance-sg" }
}

# Per-user instances
module "user_instances" {
  source   = "./modules/openclaw-instance"
  for_each = var.users

  user_id        = each.key
  slack_user_id  = each.value.slack_user_id
  instance_type  = each.value.instance_type
  ami_id         = var.openclaw_ami_id
  subnet_id      = aws_subnet.openclaw.id
  security_group = aws_security_group.openclaw_instance.id
  key_name       = var.key_name

  tags = {
    Project = "openclaw-platform"
    User    = each.key
  }
}
