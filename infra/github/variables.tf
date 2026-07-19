variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = "byson2562"

  validation {
    condition     = length(trimspace(var.github_owner)) > 0
    error_message = "github_owner must not be empty."
  }
}

variable "github_repository" {
  description = "GitHub repository name without the owner"
  type        = string
  default     = "rowing-api"

  validation {
    condition     = length(trimspace(var.github_repository)) > 0 && !strcontains(var.github_repository, "/")
    error_message = "github_repository must be a repository name without the owner."
  }
}
