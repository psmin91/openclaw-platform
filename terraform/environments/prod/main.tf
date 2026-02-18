terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

locals {
  project     = "openclaw"
  environment = "prod"

  common_tags = {
    Project     = local.project
    Environment = local.environment
    ManagedBy   = "terraform"
  }
}

################################################################################
# Networking
################################################################################
module "networking" {
  source = "../../modules/networking"

  project            = local.project
  aws_region         = var.aws_region
  vpc_cidr           = var.vpc_cidr
  az_count           = var.az_count
  enable_nat_gateway = var.enable_nat_gateway
  enable_vpc_endpoints = var.enable_vpc_endpoints
  vpc_endpoint_sg_id   = module.security.vpc_endpoint_sg_id
  common_tags        = local.common_tags
}

################################################################################
# Security
################################################################################
module "security" {
  source = "../../modules/security"

  project     = local.project
  environment = local.environment
  aws_region  = var.aws_region
  vpc_id      = module.networking.vpc_id
  vpc_cidr    = module.networking.vpc_cidr
  admin_cidr  = var.admin_cidr
  common_tags = local.common_tags
}

################################################################################
# OpenClaw Instances (per-user)
################################################################################
module "user_instances" {
  source   = "../../modules/openclaw-instance"
  for_each = var.users

  project               = local.project
  environment           = local.environment
  user_id               = each.key
  slack_user_id         = each.value.slack_user_id
  instance_type         = each.value.instance_type
  model                 = lookup(each.value, "model", "claude-sonnet")
  ami_id                = var.openclaw_ami_id
  subnet_id             = module.networking.private_subnet_ids[0]
  security_group_id     = module.security.openclaw_instance_sg_id
  instance_profile_name = module.security.ec2_instance_profile_name
  key_name              = var.key_name
  ebs_volume_size       = lookup(each.value, "ebs_size", 30)
  openclaw_port         = lookup(each.value, "port", 3000)
  auto_stop             = lookup(each.value, "auto_stop", true)
  common_tags           = local.common_tags
}

################################################################################
# Storage (DynamoDB + optional state backend)
################################################################################
module "storage" {
  source = "../../modules/storage"

  project              = local.project
  aws_account_id       = data.aws_caller_identity.current.account_id
  create_state_backend = var.create_state_backend
  common_tags          = local.common_tags

  user_instance_map = {
    for user_key, user_cfg in var.users :
    user_cfg.slack_user_id => {
      user_id       = user_key
      instance_id   = module.user_instances[user_key].instance_id
      instance_ip   = module.user_instances[user_key].private_ip
      openclaw_port = lookup(user_cfg, "port", 3000)
    }
  }
}

################################################################################
# Routing (API Gateway + Slack Router Lambda)
################################################################################
module "routing" {
  source = "../../modules/routing"

  project              = local.project
  environment          = local.environment
  lambda_source_dir    = "${path.module}/../../../slack-router/src"
  lambda_role_arn      = module.security.lambda_router_role_arn
  lambda_in_vpc        = var.lambda_in_vpc
  subnet_ids           = module.networking.private_subnet_ids
  lambda_sg_id         = module.security.lambda_sg_id
  dynamodb_table_name  = module.storage.user_mappings_table_name
  slack_signing_secret = var.slack_signing_secret
  slack_bot_token      = var.slack_bot_token
  common_tags          = local.common_tags
}

################################################################################
# Monitoring
################################################################################
module "monitoring" {
  source = "../../modules/monitoring"

  project                    = local.project
  environment                = local.environment
  autostop_role_arn          = module.security.lambda_autostop_role_arn
  autostop_schedule          = var.autostop_schedule
  alert_email                = var.alert_email
  slack_router_function_name = module.routing.lambda_function_name
  common_tags                = local.common_tags
}

################################################################################
# Outputs
################################################################################
output "vpc_id" {
  value = module.networking.vpc_id
}

output "api_endpoint" {
  value = module.routing.api_endpoint
}

output "slack_events_url" {
  value = module.routing.slack_events_url
}

output "user_instances" {
  value = { for k, v in module.user_instances : k => v.instance_details }
}

output "dynamodb_table" {
  value = module.storage.user_mappings_table_name
}
