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

variable "vpc_id" {
  type = string
}

variable "psa_connection" {
  type = string
}

variable "tier" {
  type        = string
  description = "STANDARD_HA for prod, BASIC for stg/dev."
  default     = "STANDARD_HA"
}

variable "memory_size_gb" {
  type    = number
  default = 1
}

variable "connect_mode" {
  type        = string
  description = "Memorystore network connect mode. Create-time only — changing it forces instance replacement."
  default     = "PRIVATE_SERVICE_ACCESS"
}

variable "transit_encryption_mode" {
  type        = string
  description = "TLS mode. Create-time only — changing it forces instance replacement."
  default     = "SERVER_AUTHENTICATION"
}

variable "auth_enabled" {
  type        = bool
  description = "Require AUTH string. In-place change, but flipping it on breaks clients that connect without AUTH."
  default     = true
}
