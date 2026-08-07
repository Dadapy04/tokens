resource "google_project_service" "sqladmin" {
  project            = var.project_id
  service            = "sqladmin.googleapis.com"
  disable_on_destroy = false
}

resource "random_password" "app_user" {
  length           = 32
  special          = true
  override_special = "_-"
}

resource "google_sql_database_instance" "this" {
  name                = "tokens-${var.env}${var.name_suffix}"
  database_version    = "POSTGRES_16"
  region              = var.region
  deletion_protection = var.deletion_protection
  depends_on          = [google_project_service.sqladmin, var.psa_connection]

  settings {
    edition           = "ENTERPRISE"
    tier              = var.tier
    availability_type = var.availability_type
    disk_size         = var.disk_size_gb
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.vpc_self_link
      ssl_mode        = "ENCRYPTED_ONLY"
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    maintenance_window {
      day          = 7
      hour         = 3
      update_track = "stable"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = false
    }

    database_flags {
      name  = "log_statement"
      value = "ddl"
    }

    database_flags {
      name  = "max_connections"
      value = var.max_connections
    }
  }
}

resource "google_sql_database" "tokens" {
  name     = "tokens"
  instance = google_sql_database_instance.this.name
}

resource "google_sql_user" "app" {
  name     = "tokens_app"
  instance = google_sql_database_instance.this.name
  password = random_password.app_user.result
}
