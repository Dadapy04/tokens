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
  description = "Optional trailing suffix on the regional resource names (subnet, router, VPC connector). Global resources (VPC, PSA range, firewalls) always keep their env-only names."
  default     = ""
}

