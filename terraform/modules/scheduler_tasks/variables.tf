variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "env" {
  type = string
}

variable "scheduler_sa_email" {
  type = string
}

variable "tasks_sa_email" {
  type = string
}

variable "usage_service_url" {
  type        = string
  description = "Base URL of the Cloud Run usage service that hosts cron handlers."
}

variable "queues" {
  type        = list(string)
  description = "Cloud Tasks queue names (per fan-out category)."
  default     = ["rollups", "prunes", "refreshes"]
}

variable "scheduled_jobs" {
  type = list(object({
    name     = string
    schedule = string
    path     = string
  }))
  description = "Cloud Scheduler jobs (path is appended to usage_service_url)."
  # Previously defaulted to /internal/cron/{rollup-active,prune-events,usage-digest},
  # which never existed on the usage service (404 no-ops). The canonical event
  # rollup + prune live on the assets service (`/jobs/rollup-active-api-usage`,
  # `/jobs/prune-api-request-events` via module.scheduler_jobs); the usage digest
  # runs from the ops VM systemd timer. Kept empty to prevent double-counting if
  # those paths were ever "fixed".
  default = []
}
