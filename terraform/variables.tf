variable "aws_region" {
  type        = string
  default     = "ap-south-2"
  description = "AWS region for deployment (e.g. ap-south-2 Hyderabad)"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "CIDR block for the VPC"
}

variable "public_subnet_cidr" {
  type        = string
  default     = "10.0.1.0/24"
  description = "CIDR block for public subnet"
}

variable "instance_type" {
  type        = string
  default     = "t3.medium"
  description = "EC2 instance size for Kubernetes/Helm deployment and microservices (4GB RAM, 2 vCPU)"
}

variable "ec2_ami_id" {
  type        = string
  default     = "ami-0c7217cdde317cfec" # Ubuntu 22.04 LTS LTS in us-east-1
  description = "AMI ID for EC2 instance"
}

variable "s3_bucket_name" {
  type        = string
  default     = "npci-forum-frontend-app-bucket"
  description = "Name of the S3 bucket for frontend distribution"
}
