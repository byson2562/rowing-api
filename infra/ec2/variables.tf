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

variable "iam_instance_profile_name" {
  description = "Optional IAM instance profile name"
  type        = string
  default     = null
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

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}
