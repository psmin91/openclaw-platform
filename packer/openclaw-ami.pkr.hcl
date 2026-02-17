packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "ap-northeast-2"
}

variable "openclaw_version" {
  type    = string
  default = "latest"
}

source "amazon-ebs" "openclaw" {
  ami_name      = "openclaw-{{timestamp}}"
  instance_type = "t3.small"
  region        = var.aws_region
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-arm64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]
  }
  ssh_username = "ubuntu"

  tags = {
    Name       = "OpenClaw AMI"
    Version    = var.openclaw_version
    Built      = "{{timestamp}}"
    ManagedBy  = "packer"
  }
}

build {
  sources = ["source.amazon-ebs.openclaw"]

  provisioner "shell" {
    inline = [
      "sudo apt-get update -y",
      "sudo apt-get install -y curl git nodejs npm",
      "curl -fsSL https://get.docker.com | sudo sh",
      "sudo usermod -aG docker ubuntu",

      # Install OpenClaw
      "sudo mkdir -p /opt/openclaw",
      "sudo chown ubuntu:ubuntu /opt/openclaw",
      "cd /opt/openclaw",

      # Create systemd service
      "sudo tee /etc/systemd/system/openclaw.service > /dev/null <<'SVC'",
      "[Unit]",
      "Description=OpenClaw Agent",
      "After=network.target",
      "",
      "[Service]",
      "Type=simple",
      "User=ubuntu",
      "WorkingDirectory=/opt/openclaw",
      "ExecStart=/usr/bin/node /opt/openclaw/agent.js",
      "Restart=always",
      "EnvironmentFile=/etc/environment",
      "",
      "[Install]",
      "WantedBy=multi-user.target",
      "SVC",

      "sudo systemctl daemon-reload",
      "sudo systemctl enable openclaw",
    ]
  }
}
