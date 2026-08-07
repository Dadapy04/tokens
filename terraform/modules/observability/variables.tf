variable "project_id" {
  type = string
}

variable "env" {
  type = string
}

variable "name_suffix" {
  type        = string
  description = "Trailing suffix on Cloud Run service names (matches the env module's name_suffix)."
  default     = ""
}

variable "push_target_service_url" {
  type        = string
  description = "Base URL of the Cloud Run service hosting /hooks/gcp-logs (admin)."
}
