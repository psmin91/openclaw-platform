output "instance_details" {
  value = {
    instance_id   = aws_instance.openclaw.id
    public_ip     = aws_instance.openclaw.public_ip
    private_ip    = aws_instance.openclaw.private_ip
    user_id       = var.user_id
    slack_user_id = var.slack_user_id
  }
}
