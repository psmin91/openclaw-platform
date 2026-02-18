#!/bin/bash
set -euo pipefail

# ── Environment ──────────────────────────────────────────────────────────────
cat >> /etc/environment <<'ENVEOF'
OPENCLAW_USER_ID=${user_id}
SLACK_USER_ID=${slack_user_id}
OPENCLAW_MODEL=${model}
OPENCLAW_PORT=${openclaw_port}
OPENCLAW_ENV=${environment}
ENVEOF

# ── SSM Agent ────────────────────────────────────────────────────────────────
systemctl enable amazon-ssm-agent || true
systemctl start amazon-ssm-agent || true

# ── CloudWatch Agent ─────────────────────────────────────────────────────────
if ! command -v amazon-cloudwatch-agent-ctl &>/dev/null; then
  yum install -y amazon-cloudwatch-agent 2>/dev/null || \
  apt-get install -y amazon-cloudwatch-agent 2>/dev/null || true
fi

cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'CWEOF'
{
  "agent": { "run_as_user": "root" },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/openclaw/*.log",
            "log_group_name": "/${project}/${environment}/openclaw",
            "log_stream_name": "${user_id}/{instance_id}",
            "retention_in_days": 30
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "${project}/${environment}",
    "metrics_collected": {
      "mem": { "measurement": ["mem_used_percent"] },
      "disk": { "measurement": ["used_percent"], "resources": ["*"] },
      "cpu": { "measurement": ["cpu_usage_active"] }
    },
    "append_dimensions": {
      "UserId": "${user_id}",
      "InstanceId": "$${aws:InstanceId}"
    }
  }
}
CWEOF

amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s || true

# ── OpenClaw ─────────────────────────────────────────────────────────────────
systemctl enable openclaw 2>/dev/null || true
systemctl start openclaw 2>/dev/null || true

echo "User data complete for ${user_id}" | logger -t openclaw-init
