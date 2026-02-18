################################################################################
# Launch Template
################################################################################
resource "aws_launch_template" "openclaw" {
  name_prefix   = "${var.project}-${var.user_id}-"
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name

  iam_instance_profile {
    name = var.instance_profile_name
  }

  vpc_security_group_ids = [var.security_group_id]

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = var.ebs_volume_size
      volume_type           = "gp3"
      iops                  = 3000
      throughput            = 125
      encrypted             = true
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2
    http_put_response_hop_limit = 1
  }

  monitoring {
    enabled = var.detailed_monitoring
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    user_id       = var.user_id
    slack_user_id = var.slack_user_id
    model         = var.model
    openclaw_port = var.openclaw_port
    environment   = var.environment
    project       = var.project
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name        = "${var.project}-${var.user_id}"
      UserId      = var.user_id
      SlackUserId = var.slack_user_id
      Model       = var.model
      ManagedBy   = "openclaw-platform"
      AutoStop    = var.auto_stop ? "enabled" : "disabled"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(var.common_tags, {
      Name   = "${var.project}-${var.user_id}-vol"
      UserId = var.user_id
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

################################################################################
# EC2 Instance
################################################################################
resource "aws_instance" "openclaw" {
  subnet_id = var.subnet_id

  launch_template {
    id      = aws_launch_template.openclaw.id
    version = "$Latest"
  }

  tags = merge(var.common_tags, {
    Name        = "${var.project}-${var.user_id}"
    UserId      = var.user_id
    SlackUserId = var.slack_user_id
    ManagedBy   = "openclaw-platform"
  })

  lifecycle {
    ignore_changes = [ami, user_data]
  }
}
