output "vpc_id" {
  value       = aws_vpc.main.id
  description = "The ID of the created VPC"
}

output "subnet_id" {
  value       = aws_subnet.public.id
  description = "The ID of the public subnet"
}

output "ec2_instance_id" {
  value       = aws_instance.app_server.id
  description = "The EC2 instance ID"
}

output "ec2_public_ip" {
  value       = aws_eip.app_server_eip.public_ip
  description = "The static Elastic IP address of the EC2 instance"
}

output "s3_bucket_website_endpoint" {
  value       = aws_s3_bucket_website_configuration.frontend_website.website_endpoint
  description = "URL endpoint of the static frontend S3 bucket"
}
