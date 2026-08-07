output "wif_provider" {
  value       = "projects/${var.project_number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.github.workload_identity_pool_id}/providers/${google_iam_workload_identity_pool_provider.github.workload_identity_pool_provider_id}"
  description = "Full resource name for the github WIF provider."
}

output "tf_deployer_sa_email" {
  value       = google_service_account.tf_deployer.email
  description = "Restricted to refs/heads/main — for terraform apply on push to main."
}

output "tf_planner_sa_email" {
  value       = google_service_account.tf_planner.email
  description = "Read-only — for terraform plan on PRs (any branch)."
}

output "cloudrun_deployer_sa_email" {
  value       = google_service_account.cloudrun_deployer.email
  description = "Restricted to refs/heads/main — for Cloud Run deploys."
}

output "cloud_run_runtime_sa_email" {
  value = google_service_account.cloud_run_runtime.email
}

output "scheduler_sa_email" {
  value = google_service_account.scheduler.email
}

output "tasks_sa_email" {
  value = google_service_account.tasks.email
}
