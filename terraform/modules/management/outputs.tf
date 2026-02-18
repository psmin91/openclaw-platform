output "instance_id" {
  value = aws_instance.management.id
}

output "public_ip" {
  value = aws_instance.management.public_ip
}

output "dashboard_url" {
  value = "http://${aws_instance.management.public_ip}"
}

output "api_url" {
  value = "http://${aws_instance.management.public_ip}/api"
}

output "security_group_id" {
  value = aws_security_group.management.id
}
