resource "google_project_service" "run" {
  project            = var.project_id
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_cloud_run_v2_service" "this" {
  name     = "tokens-${var.service_name}-${var.env}${var.name_suffix}"
  location = var.region
  ingress  = var.ingress

  deletion_protection = var.deletion_protection

  template {
    service_account = var.runtime_sa_email
    timeout         = var.request_timeout

    max_instance_request_concurrency = var.request_concurrency

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    vpc_access {
      egress = "ALL_TRAFFIC"

      network_interfaces {
        network    = var.network_id
        subnetwork = var.subnet_id
      }
    }

    containers {
      image = var.image

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
        cpu_idle = true
      }

      dynamic "env" {
        for_each = var.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = var.secret_env_vars
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value.secret_id
              version = env.value.version
            }
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      template[0].containers[0].env,
    ]
  }

  depends_on = [google_project_service.run]
}

resource "google_cloud_run_v2_service_iam_member" "allusers_invoker" {
  count = var.allow_unauthenticated ? 1 : 0

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.this.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
