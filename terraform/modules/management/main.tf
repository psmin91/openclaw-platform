################################################################################
# Management Instance — Dashboard + API via Docker Compose
################################################################################

# Security Group
resource "aws_security_group" "management" {
  name_prefix = "${var.project}-mgmt-"
  description = "OpenClaw Management Dashboard + API"
  vpc_id      = var.vpc_id

  # HTTP
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  # HTTPS
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  # SSH (optional)
  dynamic "ingress" {
    for_each = var.key_name != "" ? [1] : []
    content {
      description = "SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [var.admin_cidr]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.project}-mgmt-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for management instance
resource "aws_iam_role" "management" {
  name = "${var.project}-mgmt-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy" "management" {
  name = "${var.project}-mgmt-policy"
  role = aws_iam_role.management.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "ec2:StartInstances",
          "ec2:StopInstances",
          "dynamodb:*",
          "sts:GetCallerIdentity",
          "cloudwatch:GetMetricData",
          "cloudwatch:ListMetrics",
          "logs:Describe*",
          "logs:GetLogEvents",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:StartSession",
          "ssm:TerminateSession",
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "management_ssm" {
  role       = aws_iam_role.management.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "management" {
  name = "${var.project}-mgmt-${var.environment}"
  role = aws_iam_role.management.name
}

# EC2 Instance
resource "aws_instance" "management" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [aws_security_group.management.id]
  iam_instance_profile        = aws_iam_instance_profile.management.name
  key_name                    = var.key_name != "" ? var.key_name : null
  associate_public_ip_address = true

  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    project        = var.project
    environment    = var.environment
    api_port       = var.api_port
    dashboard_port = var.dashboard_port
  }))

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  tags = merge(var.common_tags, {
    Name      = "${var.project}-management"
    Component = "management"
  })

  lifecycle {
    ignore_changes = [ami, user_data]
  }
}
