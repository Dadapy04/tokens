variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "env" {
  type = string
}

variable "name_suffix" {
  type        = string
  description = "Optional trailing suffix on resource names (e.g. \"-us\" for regionally-migrated resources whose live name has an extra tag)."
  default     = ""
}

variable "vpc_self_link" {
  type = string
}

variable "psa_connection" {
  type = string
}

variable "tier" {
  type        = string
  description = "Cloud SQL machine tier (e.g. db-custom-2-7680, db-custom-1-3840)."
}

variable "availability_type" {
  type        = string
  description = "REGIONAL for HA, ZONAL for single-zone (cheaper)."
  default     = "REGIONAL"
}

variable "disk_size_gb" {
  type    = number
  default = 50
}

variable "deletion_protection" {
  type    = bool
  default = true
}

variable "max_connections" {
  type        = string
  description = "Postgres max_connections. Sized for worst-case burst: all Cloud Run services at max instances with full pools, plus headroom."
  default     = "400"
}
