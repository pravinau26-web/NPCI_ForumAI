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
  default     = "t3.micro"
  description = "EC2 instance size for Kubernetes/Helm deployment (Free Tier Eligible)"
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

variable "app_eip_allocation_id" {
  type        = string
  default     = "eipalloc-0a3ef0d9cb1f2127e" # Pre-allocated static Elastic IP (16.112.205.103)
  description = "Existing Elastic IP allocation ID for primary EC2 App Node"
}

variable "monitoring_eip_allocation_id" {
  type        = string
  default     = "eipalloc-0261f42bf9137d678" # Pre-allocated static Elastic IP (16.112.229.62)
  description = "Existing Elastic IP allocation ID for secondary Monitoring Node"
}
