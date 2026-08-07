terraform {
  backend "gcs" {
    bucket = "tokens-tf-state-stg"
    prefix = "tokens"
  }
}
