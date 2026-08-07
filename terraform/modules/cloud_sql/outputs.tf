output "instance_name" {
  value = google_sql_database_instance.this.name
}

output "connection_name" {
  value = google_sql_database_instance.this.connection_name
}

output "private_ip" {
  value = google_sql_database_instance.this.private_ip_address
}

output "database_name" {
  value = google_sql_database.tokens.name
}

output "app_user" {
  value = google_sql_user.app.name
}

output "app_password" {
  value       = random_password.app_user.result
  sensitive   = true
  description = "Generated app-user password. Push this into Doppler (TOKENS_SQL_PASSWORD) after the first apply, then ignore_changes keeps it stable."
}
