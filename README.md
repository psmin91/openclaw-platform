# 🐾 OpenClaw Multi-Tenant Management Platform

단일 Slack 앱으로 사용자별 OpenClaw EC2 인스턴스를 관리하는 플랫폼.

## Architecture

```
Slack App (single) → Management API → EC2 instances (per-user)
                   → Dashboard (monitoring)
```

## Structure

| Directory | Description | Stack |
|-----------|-------------|-------|
| `dashboard/` | Admin dashboard | Next.js + Tailwind CSS |
| `api/` | Management REST API | Node.js + Express |
| `terraform/` | Infrastructure as Code | Terraform + AWS |
| `packer/` | AMI builder | Packer + Amazon EBS |

## Quick Start

### Dashboard
```bash
cd dashboard
npm install
npm run dev    # http://localhost:3000
```

### API
```bash
cd api
npm install
npm run dev    # http://localhost:3001
```

### Terraform
```bash
cd terraform
terraform init
terraform plan -var="openclaw_ami_id=ami-xxx"
```

## Features

- 👥 100+ user management with search/filter
- 🖥️ Per-user EC2 instance lifecycle (create/start/stop/terminate)
- 💬 Single Slack App ↔ per-user OpenClaw mapping
- 💰 Cost monitoring by plan, region, user
- ⏸️ Auto-stop: 30 min inactive → EC2 stop
- ▶️ Auto-start: Slack mention → EC2 start
- 📊 CPU/Memory usage monitoring

## Key Concepts

1. **Single Slack App**: One bot, many users. Each Slack user mapped to their own OpenClaw EC2.
2. **User Lifecycle**: Add user → Create EC2 → Map Slack → Auto-manage
3. **Cost Optimization**: Auto-stop idle instances, per-user cost tracking
