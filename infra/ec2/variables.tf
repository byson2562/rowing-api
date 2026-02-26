variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "rowing-api"
}

variable "vpc_id" {
  description = "Existing VPC ID"
  type        = string
}

variable "subnet_id" {
  description = "Public subnet ID for EC2"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t4g.small"
}

variable "root_volume_size" {
  description = "Root EBS volume size (GiB)"
  type        = number
  default     = 40
}

variable "key_name" {
  description = "EC2 key pair name"
  type        = string
}

variable "ssh_cidr" {
  description = "CIDR allowed to SSH"
  type        = string
  default     = "0.0.0.0/0"
}

variable "repo_url" {
  description = "Git repository URL to clone on instance"
  type        = string
  default     = "https://github.com/byson2562/rowing-api.git"
}

variable "repo_branch" {
  description = "Git branch to deploy"
  type        = string
  default     = "main"
}

variable "deploy_user" {
  description = "Linux user that owns app directory"
  type        = string
  default     = "ec2-user"
}

variable "app_dir" {
  description = "Path where app repo is placed"
  type        = string
  default     = "/opt/rowing-api"
}

variable "enable_user_data" {
  description = "Whether to apply EC2 user_data bootstrap script"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}

variable "ecr_backend_repository_name" {
  description = "ECR repository name for backend image"
  type        = string
  default     = "rowing-api/backend"
}

variable "ecr_frontend_repository_name" {
  description = "ECR repository name for frontend image"
  type        = string
  default     = "rowing-api/frontend"
}

variable "github_repository" {
  description = "GitHub repository in owner/name format"
  type        = string
  default     = "byson2562/rowing-api"
}

variable "github_branch" {
  description = "GitHub branch allowed to assume role"
  type        = string
  default     = "main"
}

variable "github_actions_role_name" {
  description = "IAM role name for GitHub Actions to push images to ECR"
  type        = string
  default     = "rowing-api-github-actions-ecr-push"
}

variable "ec2_ecr_pull_role_name" {
  description = "IAM role name for EC2 ECR pull access"
  type        = string
  default     = "rowing-api-ec2-ecr-pull"
}

variable "ec2_ecr_pull_instance_profile_name" {
  description = "IAM instance profile name for EC2 ECR pull access"
  type        = string
  default     = "rowing-api-ec2-ecr-pull-profile"
}
