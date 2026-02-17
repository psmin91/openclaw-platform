output "vpc_id" {
  value = aws_vpc.openclaw.id
}

output "instance_details" {
  value = { for k, v in module.user_instances : k => v.instance_details }
}
