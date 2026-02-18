################################################################################
# SNS Topic for Alerts
################################################################################
resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts-${var.environment}"
  tags = var.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

################################################################################
# Auto-stop Lambda (stop idle instances nightly)
################################################################################
data "archive_file" "autostop" {
  type        = "zip"
  output_path = "${path.module}/dist/autostop.zip"

  source {
    content  = <<-JS
      const { EC2Client, DescribeInstancesCommand, StopInstancesCommand } = require('@aws-sdk/client-ec2');
      const ec2 = new EC2Client({});
      exports.handler = async () => {
        const { Reservations } = await ec2.send(new DescribeInstancesCommand({
          Filters: [
            { Name: 'tag:Project', Values: [process.env.PROJECT] },
            { Name: 'tag:AutoStop', Values: ['enabled'] },
            { Name: 'instance-state-name', Values: ['running'] },
          ],
        }));
        const ids = (Reservations || []).flatMap(r => r.Instances.map(i => i.InstanceId));
        if (ids.length > 0) {
          await ec2.send(new StopInstancesCommand({ InstanceIds: ids }));
          console.log('Stopped:', ids);
        } else {
          console.log('No instances to stop');
        }
        return { stopped: ids };
      };
    JS
    filename = "index.js"
  }
}

resource "aws_lambda_function" "autostop" {
  function_name    = "${var.project}-autostop-${var.environment}"
  filename         = data.archive_file.autostop.output_path
  source_code_hash = data.archive_file.autostop.output_base64sha256
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 60
  memory_size      = 128
  role             = var.autostop_role_arn

  environment {
    variables = {
      PROJECT = var.project
    }
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_event_rule" "autostop_schedule" {
  name                = "${var.project}-autostop-${var.environment}"
  description         = "Stop OpenClaw instances at night"
  schedule_expression = var.autostop_schedule

  tags = var.common_tags
}

resource "aws_cloudwatch_event_target" "autostop" {
  rule = aws_cloudwatch_event_rule.autostop_schedule.name
  arn  = aws_lambda_function.autostop.arn
}

resource "aws_lambda_permission" "autostop_eventbridge" {
  statement_id  = "AllowEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.autostop.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.autostop_schedule.arn
}

################################################################################
# CloudWatch Alarms
################################################################################
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project}-slack-router-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Slack router Lambda errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = var.slack_router_function_name
  }

  tags = var.common_tags
}
