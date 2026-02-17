output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.rowing_api.id
}

output "public_ip" {
  description = "Elastic IP"
  value       = aws_eip.rowing_api.public_ip
}

output "public_dns" {
  description = "Public DNS of EC2"
  value       = aws_instance.rowing_api.public_dns
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.rowing_api.id
}

output "app_dir" {
  description = "Application directory on instance"
  value       = var.app_dir
}
