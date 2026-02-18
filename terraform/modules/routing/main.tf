################################################################################
# Lambda — Slack Router
################################################################################
data "archive_file" "slack_router" {
  type        = "zip"
  source_dir  = var.lambda_source_dir
  output_path = "${path.module}/dist/slack-router.zip"
}

resource "aws_lambda_function" "slack_router" {
  function_name    = "${var.project}-slack-router-${var.environment}"
  filename         = data.archive_file.slack_router.output_path
  source_code_hash = data.archive_file.slack_router.output_base64sha256
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 256
  role             = var.lambda_role_arn

  dynamic "vpc_config" {
    for_each = var.lambda_in_vpc ? [1] : []
    content {
      subnet_ids         = var.subnet_ids
      security_group_ids = [var.lambda_sg_id]
    }
  }

  environment {
    variables = {
      DYNAMODB_TABLE     = var.dynamodb_table_name
      SLACK_SIGNING_SECRET = var.slack_signing_secret
      SLACK_BOT_TOKEN    = var.slack_bot_token
      OPENCLAW_PORT      = tostring(var.openclaw_port)
      NODE_ENV           = var.environment
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.project}-slack-router"
  })
}

################################################################################
# API Gateway (HTTP API v2)
################################################################################
resource "aws_apigatewayv2_api" "slack" {
  name          = "${var.project}-slack-api-${var.environment}"
  protocol_type = "HTTP"

  tags = var.common_tags
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.slack.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.slack_router.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "slack_events" {
  api_id    = aws_apigatewayv2_api.slack.id
  route_key = "POST /slack/events"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.slack.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.slack.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      integrationError = "$context.integrationErrorMessage"
    })
  }
}

resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/apigateway/${var.project}-slack-${var.environment}"
  retention_in_days = 14
  tags              = var.common_tags
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.slack_router.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.slack.execution_arn}/*/*"
}
