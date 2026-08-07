output "ip_address" {
  value = google_compute_global_address.lb_ip.address
}

output "certificate_name" {
  value = google_compute_managed_ssl_certificate.cert.name
}
