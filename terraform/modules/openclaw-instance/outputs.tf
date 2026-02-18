output "instance_id" {
  value = aws_instance.openclaw.id
}

output "private_ip" {
  value = aws_instance.openclaw.private_ip
}

output "public_ip" {
  value = aws_instance.openclaw.public_ip
}

output "instance_details" {
  value = {
    instance_id   = aws_instance.openclaw.id
    private_ip    = aws_instance.openclaw.private_ip
    public_ip     = aws_instance.openclaw.public_ip
    user_id       = var.user_id
    slack_user_id = var.slack_user_id
    model         = var.model
    ssm_url       = "https://${var.project}.console.aws.amazon.com/systems-manager/session-manager/${aws_instance.openclaw.id}"
  }
}
