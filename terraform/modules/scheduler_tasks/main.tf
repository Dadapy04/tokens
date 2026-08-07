resource "google_project_service" "scheduler_tasks" {
  for_each = toset([
    "cloudscheduler.googleapis.com",
    "cloudtasks.googleapis.com",
  ])
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_cloud_tasks_queue" "queues" {
  for_each = toset(var.queues)
  name     = "tokens-${each.value}-${var.env}"
  location = var.region

  rate_limits {
    max_concurrent_dispatches = 100
    max_dispatches_per_second = 50
  }

  retry_config {
    max_attempts       = 5
    min_backoff        = "10s"
    max_backoff        = "300s"
    max_doublings      = 4
    max_retry_duration = "3600s"
  }

  depends_on = [google_project_service.scheduler_tasks]
}

resource "google_cloud_scheduler_job" "jobs" {
  for_each = { for j in var.scheduled_jobs : j.name => j }

  name        = "tokens-${each.value.name}-${var.env}"
  schedule    = each.value.schedule
  region      = var.region
  time_zone   = "Etc/UTC"
  description = "tokens.xyz scheduled job: ${each.value.name}"

  retry_config {
    retry_count          = 3
    min_backoff_duration = "10s"
    max_backoff_duration = "120s"
  }

  http_target {
    http_method = "POST"
    uri         = "${var.usage_service_url}${each.value.path}"

    oidc_token {
      service_account_email = var.scheduler_sa_email
      audience              = var.usage_service_url
    }
  }

  depends_on = [google_project_service.scheduler_tasks]
}
