#!/bin/bash
set -euo pipefail

# ── Install Docker ───────────────────────────────────────────────────────────
yum update -y
yum install -y docker git
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# ── Install Docker Compose ───────────────────────────────────────────────────
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# ── Create app directory ─────────────────────────────────────────────────────
mkdir -p /opt/openclaw-platform
cat > /opt/openclaw-platform/.env <<'ENVEOF'
PROJECT=${project}
ENVIRONMENT=${environment}
API_PORT=${api_port}
DASHBOARD_PORT=${dashboard_port}
TERRAFORM_MOCK=true
AWS_CONFIGURED=false
ENVEOF

# ── Docker Compose file ─────────────────────────────────────────────────────
cat > /opt/openclaw-platform/docker-compose.yml <<'DCEOF'
version: '3.8'
services:
  api:
    image: node:20-slim
    working_dir: /app
    volumes:
      - ./api:/app
    ports:
      - "${api_port}:${api_port}"
    env_file: .env
    command: ["node", "src/index.js"]
    restart: unless-stopped

  dashboard:
    image: node:20-slim
    working_dir: /app
    volumes:
      - ./dashboard:/app
    ports:
      - "${dashboard_port}:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:${api_port}
    command: ["npm", "start"]
    restart: unless-stopped
    depends_on:
      - api

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    restart: unless-stopped
    depends_on:
      - api
      - dashboard
DCEOF

# ── Nginx config ─────────────────────────────────────────────────────────────
cat > /opt/openclaw-platform/nginx.conf <<'NGEOF'
server {
    listen 80;
    server_name _;

    location /api/ {
        proxy_pass http://api:${api_port}/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://api:${api_port}/health;
    }

    location / {
        proxy_pass http://dashboard:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGEOF

# ── SSM Agent ────────────────────────────────────────────────────────────────
systemctl enable amazon-ssm-agent || true
systemctl start amazon-ssm-agent || true

echo "Management instance setup complete" | logger -t openclaw-mgmt
