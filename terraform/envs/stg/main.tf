data "google_project" "this" {}

module "env" {
  source = "../../modules/env"

  project_id     = data.google_project.this.project_id
  project_number = data.google_project.this.number
  env            = var.env
  region         = var.region
  name_suffix    = "-us"

  cloud_sql_tier                = "db-custom-1-3840"
  cloud_sql_availability_type   = "ZONAL"
  cloud_sql_disk_size_gb        = 20
  cloud_sql_deletion_protection = false

  memorystore_tier           = "BASIC"
  memorystore_memory_size_gb = 1

  cloud_run_max_instances       = 5
  cloud_run_deletion_protection = false
  cloud_run_ingress             = "INGRESS_TRAFFIC_ALL"
  cloud_run_unauthenticated_services = [
    "assets",
    "prices",
    "usage",
  ]

  enable_load_balancer = false
  enable_crons         = true
}

output "wif_provider" {
  value = module.env.wif_provider
}

output "tf_deployer_sa_email" {
  value = module.env.tf_deployer_sa_email
}

output "tf_planner_sa_email" {
  value = module.env.tf_planner_sa_email
}

output "cloudrun_deployer_sa_email" {
  value = module.env.cloudrun_deployer_sa_email
}

output "cloud_run_runtime_sa_email" {
  value = module.env.cloud_run_runtime_sa_email
}

output "artifact_registry_url" {
  value = module.env.artifact_registry_url
}

output "cloud_run_urls" {
  value = module.env.cloud_run_urls
}

output "cloud_sql_connection_name" {
  value = module.env.cloud_sql_connection_name
}

output "cloud_sql_app_password" {
  value     = module.env.cloud_sql_app_password
  sensitive = true
}

output "memorystore_host" {
  value = module.env.memorystore_host
}

output "memorystore_auth_string" {
  value     = module.env.memorystore_auth_string
  sensitive = true
}

output "cloudrun_auth_token_secret_id" {
  value = module.env.cloudrun_auth_token_secret_id
}

output "cloudrun_auth_token_value" {
  value     = module.env.cloudrun_auth_token_value
  sensitive = true
}

output "database_url_secret_id" {
  value = module.env.database_url_secret_id
}
