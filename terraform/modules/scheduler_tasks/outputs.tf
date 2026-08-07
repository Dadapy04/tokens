output "queue_names" {
  value = [for q in google_cloud_tasks_queue.queues : q.name]
}

output "job_names" {
  value = [for j in google_cloud_scheduler_job.jobs : j.name]
}
