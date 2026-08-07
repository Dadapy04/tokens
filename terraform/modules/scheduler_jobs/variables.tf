variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "env" {
  type = string
}

variable "service_url" {
  type        = string
  description = "Base URL of the Cloud Run service that hosts /jobs/* handlers (typically the assets service)."
}

variable "invoker_sa_email" {
  type        = string
  description = "Service account email Cloud Scheduler signs OIDC tokens with. Must have roles/run.invoker on the target Cloud Run service."
}

variable "jobs" {
  type = list(object({
    name             = string
    schedule         = string
    http_path        = string
    body_json        = optional(string, "{}")
    attempt_deadline = optional(string, "320s")
    retry_count      = optional(number, 3)
    min_backoff      = optional(string, "10s")
    max_backoff      = optional(string, "120s")
    max_doublings    = optional(number, 4)
    description      = optional(string, "")
  }))
  description = "Cloud Scheduler jobs; http_path is appended to service_url and signed with an OIDC token."
  default     = []
}
