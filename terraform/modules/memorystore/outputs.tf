output "host" {
  value = google_redis_instance.this.host
}

output "port" {
  value = google_redis_instance.this.port
}

output "auth_string" {
  value       = google_redis_instance.this.auth_string
  sensitive   = true
  description = "Redis AUTH string. Push this into Doppler (TOKENS_REDIS_AUTH) after first apply."
}

output "instance_name" {
  value = google_redis_instance.this.name
}
