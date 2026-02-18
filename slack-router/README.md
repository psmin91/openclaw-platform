# OpenClaw Slack Router

Slack Events API → API Gateway → Lambda → OpenClaw 인스턴스 라우터.

## Architecture

```
Slack App (1개, HTTP mode)
    │
    ▼ POST /slack/events
┌──────────────────────┐
│  API Gateway (HTTP)  │
│  + Lambda            │
│                      │
│  1. Signature 검증    │
│  2. DynamoDB 조회     │
│  3. EC2 포워딩        │
│  4. Slack 응답        │
└──────────────────────┘
    │         │
    ▼         ▼
 OpenClaw  OpenClaw
 (User A)  (User B)
```

## Events Handled

| Event | Description |
|-------|-------------|
| `url_verification` | Slack 앱 설정 시 URL 검증 |
| `message` (DM) | 사용자 DM → 해당 인스턴스로 포워딩 |
| `app_mention` | @멘션 → 해당 인스턴스로 포워딩 |

## DynamoDB Schema

**Table:** `openclaw-user-mappings`

| Key | Type | Description |
|-----|------|-------------|
| `slack_user_id` (PK) | String | Slack User ID (e.g., U01234567) |
| `user_id` | String | Internal user ID |
| `instance_id` | String | EC2 Instance ID |
| `instance_ip` | String | Private IP of EC2 |
| `openclaw_port` | Number | OpenClaw port (default 3000) |
| `status` | String | active / inactive / pending |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DYNAMODB_TABLE` | DynamoDB table name |
| `SLACK_SIGNING_SECRET` | Slack app signing secret |
| `SLACK_BOT_TOKEN` | Slack bot token (`xoxb-...`) |
| `OPENCLAW_PORT` | Default OpenClaw port |

## Deployment

Deployed via Terraform `routing` module. The Lambda source is zipped from `src/`.

```bash
# Manual test
cd slack-router && npm install
# Deploy via Terraform
cd terraform/environments/dev && terraform apply
```

## Local Testing

```bash
# Simulate url_verification
curl -X POST http://localhost:3000/slack/events \
  -H 'Content-Type: application/json' \
  -d '{"type":"url_verification","challenge":"test123"}'
```
