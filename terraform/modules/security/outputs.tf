output "ec2_instance_profile_name" {
  value = aws_iam_instance_profile.ec2_openclaw.name
}

output "ec2_role_arn" {
  value = aws_iam_role.ec2_openclaw.arn
}

output "lambda_router_role_arn" {
  value = aws_iam_role.lambda_router.arn
}

output "lambda_autostop_role_arn" {
  value = aws_iam_role.lambda_autostop.arn
}

output "openclaw_instance_sg_id" {
  value = aws_security_group.openclaw_instance.id
}

output "lambda_sg_id" {
  value = aws_security_group.lambda.id
}

output "vpc_endpoint_sg_id" {
  value = aws_security_group.vpc_endpoints.id
}
