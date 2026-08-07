output "logs_topic" {
  value = google_pubsub_topic.logs.name
}

output "logs_subscription" {
  value = google_pubsub_subscription.logs_to_grafana.name
}

output "gcp_logs_invoker_sa_email" {
  value       = google_service_account.logs_pusher.email
  description = "Set as GCP_LOGS_INVOKER_SA on the usage service (deploy-time env)."
}

output "logs_pusher_sa_email" {
  value       = google_service_account.logs_pusher.email
  description = "Grant run.invoker on the push target service."
}
