terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-kernel-6.1-arm64"]
  }
}

locals {
  github_actions_sub = "repo:${var.github_repository}:ref:refs/heads/${var.github_branch}"
  backend_repo_arn   = aws_ecr_repository.backend.arn
  frontend_repo_arn  = aws_ecr_repository.frontend.arn
}

resource "aws_ecr_repository" "backend" {
  name = var.ecr_backend_repository_name

  image_scanning_configuration {
    scan_on_push = true
  }

  image_tag_mutability = "MUTABLE"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecr-backend"
  })
}

resource "aws_ecr_repository" "frontend" {
  name = var.ecr_frontend_repository_name

  image_scanning_configuration {
    scan_on_push = true
  }

  image_tag_mutability = "MUTABLE"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecr-frontend"
  })
}

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-github-oidc"
  })
}

data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [local.github_actions_sub]
    }
  }
}

resource "aws_iam_role" "github_actions_ecr_push" {
  name               = var.github_actions_role_name
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-github-actions-ecr-push"
  })
}

data "aws_iam_policy_document" "github_actions_ecr_push" {
  statement {
    sid    = "AllowGetAuthorizationToken"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "AllowPushPullOnRepositories"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeImages",
      "ecr:DescribeRepositories",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:ListImages",
      "ecr:PutImage",
      "ecr:UploadLayerPart"
    ]
    resources = [local.backend_repo_arn, local.frontend_repo_arn]
  }
}

resource "aws_iam_policy" "github_actions_ecr_push" {
  name   = "${var.name_prefix}-github-actions-ecr-push"
  policy = data.aws_iam_policy_document.github_actions_ecr_push.json

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-github-actions-ecr-push"
  })
}

resource "aws_iam_role_policy_attachment" "github_actions_ecr_push" {
  role       = aws_iam_role.github_actions_ecr_push.name
  policy_arn = aws_iam_policy.github_actions_ecr_push.arn
}

data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ec2_ecr_pull" {
  name               = var.ec2_ecr_pull_role_name
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ec2-ecr-pull"
  })
}

data "aws_iam_policy_document" "ec2_ecr_pull" {
  statement {
    sid    = "AllowGetAuthorizationToken"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "AllowPullOnRepositories"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:DescribeImages",
      "ecr:DescribeRepositories",
      "ecr:GetDownloadUrlForLayer",
      "ecr:ListImages"
    ]
    resources = [local.backend_repo_arn, local.frontend_repo_arn]
  }
}

resource "aws_iam_policy" "ec2_ecr_pull" {
  name   = "${var.name_prefix}-ec2-ecr-pull"
  policy = data.aws_iam_policy_document.ec2_ecr_pull.json

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ec2-ecr-pull"
  })
}

resource "aws_iam_role_policy_attachment" "ec2_ecr_pull" {
  role       = aws_iam_role.ec2_ecr_pull.name
  policy_arn = aws_iam_policy.ec2_ecr_pull.arn
}

resource "aws_iam_instance_profile" "ec2_ecr_pull" {
  name = var.ec2_ecr_pull_instance_profile_name
  role = aws_iam_role.ec2_ecr_pull.name
}

resource "aws_security_group" "rowing_api" {
  name        = "${var.name_prefix}-sg"
  description = "Security group for RowingAPI EC2"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-sg"
  })
}

resource "aws_instance" "rowing_api" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [aws_security_group.rowing_api.id]
  key_name               = var.key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2_ecr_pull.name

  root_block_device {
    volume_size           = var.root_volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  user_data = var.enable_user_data ? templatefile("${path.module}/templates/user_data.sh.tftpl", {
    repo_url    = var.repo_url
    deploy_user = var.deploy_user
    app_dir     = var.app_dir
    branch      = var.repo_branch
  }) : null

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ec2"
  })
}

resource "aws_eip" "rowing_api" {
  domain   = "vpc"
  instance = aws_instance.rowing_api.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-eip"
  })
}
