variable "aws_region" {
  type        = string
  description = "AWS deployment region"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Target deployment environment"
  default     = "production"
}

variable "project_name" {
  type        = string
  description = "Unique project namespace"
  default     = "shipment-piggybacking"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the dual-tier VPC"
  default     = "10.0.0.0/16"
}

variable "node_app_port" {
  type        = number
  description = "Container port exposed by the Node.js API"
  default     = 3000
}

variable "python_app_port" {
  type        = number
  description = "Container port exposed by the Python FastAPI engine"
  default     = 8000
}

variable "node_fargate_cpu" {
  type        = number
  description = "Fargate CPU units for Node.js API (1024 = 1 vCPU)"
  default     = 512
}

variable "node_fargate_memory" {
  type        = number
  description = "Fargate Memory (MB) for Node.js API"
  default     = 1024
}

variable "python_fargate_cpu" {
  type        = number
  description = "Fargate CPU units for Python Optimization Engine"
  default     = 1024
}

variable "python_fargate_memory" {
  type        = number
  description = "Fargate Memory (MB) for Python Optimization Engine"
  default     = 2048
}
