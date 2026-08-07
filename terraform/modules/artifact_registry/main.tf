resource "google_project_service" "artifactregistry" {
  project            = var.project_id
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "containers" {
  location      = var.region
  repository_id = "tokens-${var.env}"
  description   = "Container images for tokens Cloud Run services (${var.env})."
  format        = "DOCKER"
  depends_on    = [google_project_service.artifactregistry]
}
