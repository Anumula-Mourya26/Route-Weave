output "ecr_node_repo_url" {
  description = "URL of the ECR repository for the Node.js backend container image"
  value       = aws_ecr_repository.node_backend.repository_url
}

output "ecr_python_repo_url" {
  description = "URL of the ECR repository for the Python Optimization Engine container image"
  value       = aws_ecr_repository.python_engine.repository_url
}

output "s3_frontend_bucket_name" {
  description = "Name of the S3 bucket hosting the React frontend assets"
  value       = aws_s3_bucket.frontend_bucket.id
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution serving the React frontend"
  value       = aws_cloudfront_distribution.frontend_cdn.id
}

output "cloudfront_domain_name" {
  description = "Public domain URL of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend_cdn.domain_name
}

output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer routing to Node.js API"
  value       = aws_lb.main.dns_name
}

output "ecs_cluster_name" {
  description = "Name of the provisioned ECS cluster"
  value       = aws_ecs_cluster.main.name
}
