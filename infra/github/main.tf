terraform {
  required_version = ">= 1.5.0"

  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.12"
    }
  }
}

provider "github" {
  owner = var.github_owner
}

resource "github_workflow_repository_permissions" "this" {
  repository                       = var.github_repository
  default_workflow_permissions     = "read"
  can_approve_pull_request_reviews = true
}
