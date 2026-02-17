resource "aws_instance" "openclaw" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group]
  key_name               = var.key_name

  user_data = <<-EOF
    #!/bin/bash
    echo "OPENCLAW_USER_ID=${var.user_id}" >> /etc/environment
    echo "SLACK_USER_ID=${var.slack_user_id}" >> /etc/environment
    systemctl start openclaw
  EOF

  tags = merge(var.tags, {
    Name         = "openclaw-${var.user_id}"
    SlackUserId  = var.slack_user_id
    ManagedBy    = "openclaw-platform"
  })

  lifecycle {
    ignore_changes = [ami]
  }
}
