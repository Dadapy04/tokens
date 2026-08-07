variable "project_id" {
  type        = string
  description = "GCP project hosting tokens.xyz staging infrastructure."
  default     = "tokens-stage"
}

variable "region" {
  type        = string
  description = "Primary GCP region for all regional resources."
  default     = "us-east4"
}

variable "env" {
  type        = string
  description = "Environment name (dev / stg / prd)."
  default     = "stg"
}
