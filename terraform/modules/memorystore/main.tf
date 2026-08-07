resource "google_project_service" "redis" {
  project            = var.project_id
  service            = "redis.googleapis.com"
  disable_on_destroy = false
}

resource "google_redis_instance" "this" {
  name           = "tokens-redis-${var.env}${var.name_suffix}"
  tier           = var.tier
  memory_size_gb = var.memory_size_gb
  region         = var.region

  authorized_network      = var.vpc_id
  connect_mode            = var.connect_mode
  redis_version           = "REDIS_7_2"
  transit_encryption_mode = var.transit_encryption_mode
  auth_enabled            = var.auth_enabled

  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 3
        minutes = 0
      }
    }
  }

  depends_on = [google_project_service.redis, var.psa_connection]
}
