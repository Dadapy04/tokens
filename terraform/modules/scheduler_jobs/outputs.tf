output "job_names" {
  value = [for j in google_cloud_scheduler_job.jobs : j.name]
}

output "jobs_by_name" {
  value = { for j in google_cloud_scheduler_job.jobs : j.name => j.id }
}
