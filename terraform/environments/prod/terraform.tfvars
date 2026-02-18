# ─────────────────────────────────────────────────────────────────────────────
# OpenClaw Platform — Prod Environment
# ─────────────────────────────────────────────────────────────────────────────

aws_region      = "ap-northeast-2"
openclaw_ami_id = "ami-0abcdef1234567890" # TODO: replace with real AMI
key_name        = "openclaw-key"

enable_nat_gateway   = true
enable_vpc_endpoints = true  # Enable for prod (private subnet SSM access)
lambda_in_vpc        = true

autostop_schedule = "cron(0 15 * * ? *)"
alert_email       = ""

# ─────────────────────────────────────────────────────────────────────────────
# Users
# ─────────────────────────────────────────────────────────────────────────────
users = {
  # Add production users here
}
