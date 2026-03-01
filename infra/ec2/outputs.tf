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

output "ecr_registry" {
  description = "ECR registry URI"
  value       = split("/", aws_ecr_repository.frontend.repository_url)[0]
}

output "ecr_frontend_repository_url" {
  description = "Frontend ECR repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions (set as AWS_ROLE_TO_ASSUME)"
  value       = aws_iam_role.github_actions_ecr_push.arn
}

output "ec2_ecr_pull_instance_profile_name" {
  description = "EC2 instance profile name for ECR pull"
  value       = aws_iam_instance_profile.ec2_ecr_pull.name
}
