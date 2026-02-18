################################################################################
# IAM Role — EC2 (OpenClaw instances)
################################################################################
resource "aws_iam_role" "ec2_openclaw" {
  name = "${var.project}-ec2-openclaw-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_openclaw.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "ec2_cloudwatch" {
  name = "${var.project}-ec2-cloudwatch"
  role = aws_iam_role.ec2_openclaw.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "cloudwatch:PutMetricData",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
        ]
        Resource = [
          "arn:aws:s3:::${var.project}-*",
          "arn:aws:s3:::${var.project}-*/*",
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:UpdateItem",
          "dynamodb:PutItem",
          "dynamodb:GetItem",
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:*:table/${var.project}-*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_openclaw" {
  name = "${var.project}-ec2-openclaw-${var.environment}"
  role = aws_iam_role.ec2_openclaw.name
}

################################################################################
# IAM Role — Lambda (Slack Router)
################################################################################
resource "aws_iam_role" "lambda_router" {
  name = "${var.project}-lambda-router-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_router.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_router.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_app" {
  name = "${var.project}-lambda-app"
  role = aws_iam_role.lambda_router.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:*:table/${var.project}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:StartInstances",
          "ec2:StopInstances",
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ec2:ResourceTag/Project" = var.project
          }
        }
      }
    ]
  })
}

################################################################################
# IAM Role — Auto-stop Lambda
################################################################################
resource "aws_iam_role" "lambda_autostop" {
  name = "${var.project}-lambda-autostop-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "autostop_basic" {
  role       = aws_iam_role.lambda_autostop.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "autostop_ec2" {
  name = "${var.project}-autostop-ec2"
  role = aws_iam_role.lambda_autostop.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ec2:DescribeInstances",
        "ec2:StopInstances",
      ]
      Resource = "*"
      Condition = {
        StringEquals = {
          "ec2:ResourceTag/Project" = var.project
        }
      }
    }]
  })
}

################################################################################
# Security Groups
################################################################################

# OpenClaw instances
resource "aws_security_group" "openclaw_instance" {
  name_prefix = "${var.project}-instance-"
  description = "OpenClaw EC2 instances"
  vpc_id      = var.vpc_id

  # OpenClaw API from within VPC (Lambda forwarding)
  ingress {
    description = "OpenClaw API from VPC"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # SSH from admin (optional, prefer SSM)
  dynamic "ingress" {
    for_each = var.admin_cidr != "" ? [1] : []
    content {
      description = "SSH admin"
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
    Name = "${var.project}-instance-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Lambda
resource "aws_security_group" "lambda" {
  name_prefix = "${var.project}-lambda-"
  description = "Lambda Slack router"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.project}-lambda-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${var.project}-vpce-"
  description = "VPC Endpoints"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.project}-vpce-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}
