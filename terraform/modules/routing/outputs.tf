output "api_endpoint" {
  value = aws_apigatewayv2_api.slack.api_endpoint
}

output "slack_events_url" {
  value = "${aws_apigatewayv2_api.slack.api_endpoint}/slack/events"
}

output "lambda_function_name" {
  value = aws_lambda_function.slack_router.function_name
}

output "lambda_function_arn" {
  value = aws_lambda_function.slack_router.arn
}
