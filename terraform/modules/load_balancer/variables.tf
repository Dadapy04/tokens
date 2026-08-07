variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "env" {
  type = string
}

variable "domain" {
  type        = string
  description = "Hostname to terminate TLS on (e.g. api.tokens.xyz)."
}

variable "cloud_run_service_name" {
  type = string
}
