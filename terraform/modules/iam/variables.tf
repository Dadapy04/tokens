variable "project_id" {
  type = string
}

variable "project_number" {
  type = string
}

variable "env" {
  type = string
}

variable "github_repo" {
  type        = string
  description = "GitHub repository in owner/name form."
  default     = "solana-foundation/tokens"
}
