variable "project_id" {
  type = string
}

variable "env" {
  type = string
}

variable "region" {
  type = string
}

variable "runtime_sa_email" {
  type        = string
  description = "Cloud Run runtime SA — gets roles/secretmanager.secretAccessor on the runtime secrets."
}

variable "sql_app_user" {
  type = string
}

variable "sql_app_password" {
  type      = string
  sensitive = true
}

variable "sql_private_ip" {
  type = string
}

variable "sql_database_name" {
  type = string
}
