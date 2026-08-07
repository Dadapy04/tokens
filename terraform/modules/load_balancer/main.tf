resource "google_compute_region_network_endpoint_group" "neg" {
  name                  = "tokens-neg-${var.env}"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = var.cloud_run_service_name
  }

  # Region moves replace the NEG; the backend service must swap to the new one
  # before the old can be deleted or GCP rejects the destroy as in-use.
  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_backend_service" "backend" {
  name                  = "tokens-backend-${var.env}"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"

  backend {
    group = google_compute_region_network_endpoint_group.neg.id
  }

  security_policy = google_compute_security_policy.armor.id

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

resource "google_compute_url_map" "url_map" {
  name            = "tokens-urlmap-${var.env}"
  default_service = google_compute_backend_service.backend.id
}

resource "google_compute_managed_ssl_certificate" "cert" {
  name = "tokens-cert-${var.env}"

  managed {
    domains = [var.domain]
  }
}

resource "google_compute_target_https_proxy" "https_proxy" {
  name             = "tokens-https-${var.env}"
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.cert.id]
}

resource "google_compute_global_address" "lb_ip" {
  name = "tokens-lb-ip-${var.env}"
}

resource "google_compute_global_forwarding_rule" "https" {
  name                  = "tokens-fwd-https-${var.env}"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  ip_address            = google_compute_global_address.lb_ip.address
  port_range            = "443"
  target                = google_compute_target_https_proxy.https_proxy.id
}

resource "google_compute_security_policy" "armor" {
  name = "tokens-armor-${var.env}"

  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "default rule"
  }

  rule {
    action   = "throttle"
    priority = 1000
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 600
        interval_sec = 60
      }
    }
    description = "per-IP rate limit: 600 req/min"
  }

  rule {
    action   = "deny(403)"
    priority = 100
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "OWASP XSS rules"
  }

  rule {
    action   = "deny(403)"
    priority = 101
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "OWASP SQLi rules"
  }
}
