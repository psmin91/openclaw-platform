output "sns_topic_arn" {
  value = aws_sns_topic.alerts.arn
}

output "autostop_function_name" {
  value = aws_lambda_function.autostop.function_name
}
