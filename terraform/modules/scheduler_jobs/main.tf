resource "google_project_service" "scheduler" {
  project            = var.project_id
  service            = "cloudscheduler.googleapis.com"
  disable_on_destroy = false
}

resource "google_cloud_scheduler_job" "jobs" {
  for_each = { for j in var.jobs : j.name => j }

  name             = "tokens-${each.value.name}-${var.env}"
  schedule         = each.value.schedule
  region           = var.region
  time_zone        = "Etc/UTC"
  description      = each.value.description != "" ? each.value.description : "tokens.xyz cron: ${each.value.name}"
  attempt_deadline = each.value.attempt_deadline

  retry_config {
    retry_count          = each.value.retry_count
    min_backoff_duration = each.value.min_backoff
    max_backoff_duration = each.value.max_backoff
    max_doublings        = each.value.max_doublings
  }

  http_target {
    http_method = "POST"
    uri         = "${var.service_url}${each.value.http_path}"
    body        = base64encode(each.value.body_json)
    headers = {
      "Content-Type" = "application/json"
    }

    oidc_token {
      service_account_email = var.invoker_sa_email
      audience              = var.service_url
    }
  }

  depends_on = [google_project_service.scheduler]
}
