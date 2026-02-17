variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "admin_cidr" {
  description = "CIDR block for SSH access"
  type        = string
  default     = "0.0.0.0/0"
}

variable "openclaw_ami_id" {
  description = "AMI ID for OpenClaw instances (built by Packer)"
  type        = string
  default     = "ami-0abcdef1234567890"
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = "openclaw-key"
}

variable "users" {
  description = "Map of user configurations"
  type = map(object({
    slack_user_id = string
    instance_type = string
  }))
  default = {
    "user-001" = {
      slack_user_id = "U00001000"
      instance_type = "t3.small"
    }
    "user-002" = {
      slack_user_id = "U00001001"
      instance_type = "t3.medium"
    }
  }
}
