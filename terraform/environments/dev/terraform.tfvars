# ─────────────────────────────────────────────────────────────────────────────
# OpenClaw Platform — Dev Environment
# ─────────────────────────────────────────────────────────────────────────────

aws_region      = "ap-northeast-2"
openclaw_ami_id = "ami-0abcdef1234567890" # TODO: replace with real AMI
key_name        = "openclaw-key"

# Cost optimization for dev
enable_nat_gateway   = true
enable_vpc_endpoints = false
lambda_in_vpc        = true

# Slack (set via TF_VAR_slack_signing_secret, TF_VAR_slack_bot_token env vars)
# slack_signing_secret = ""
# slack_bot_token      = ""

# Auto-stop at midnight KST
autostop_schedule = "cron(0 15 * * ? *)"
alert_email       = ""

# ─────────────────────────────────────────────────────────────────────────────
# Users — 사용자 추가는 여기에 항목만 추가하면 됩니다
# ─────────────────────────────────────────────────────────────────────────────
users = {
  "user-001" = {
    slack_user_id = "U00001000"
    instance_type = "t3.small"
    model         = "claude-sonnet"
  }
  "user-002" = {
    slack_user_id = "U00001001"
    instance_type = "t3.medium"
    model         = "claude-opus"
  }
  "user-003" = {
    slack_user_id = "U00001002"
    instance_type = "t3.small"
    model         = "claude-sonnet"
  }
  "user-004" = {
    slack_user_id = "U00001003"
    instance_type = "t3.large"
    model         = "claude-opus"
    ebs_size      = 50
  }
}
