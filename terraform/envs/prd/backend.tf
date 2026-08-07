terraform {
  backend "gcs" {
    bucket = "tokens-tf-state-prd"
    prefix = "tokens"
  }
}
