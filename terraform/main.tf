terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket                      = "npci-forum-tfstate-ap-south-2"
    key                         = "state/terraform.tfstate"
    region                      = "ap-south-2"
    skip_region_validation      = true
    skip_credentials_validation = true
  }
}

provider "aws" {
  region = var.aws_region
}

# Dynamic Availability Zone Lookup for Region (e.g. ap-south-2)
data "aws_availability_zones" "available" {
  state = "available"
}

# 1. VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "npci-forum-vpc"
    Environment = "production"
  }
}

# 2. Internet Gateway
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "npci-forum-igw"
  }
}

# 3. Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  map_public_ip_on_launch = true
  availability_zone       = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "npci-forum-public-subnet"
  }
}

# 4. Route Table & Association
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "npci-forum-public-rt"
  }
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public_rt.id
}

# 5. Security Group for EC2 / Kubernetes Node
resource "aws_security_group" "ec2_sg" {
  name        = "npci-forum-ec2-sg"
  description = "Security group for NPCI Forum EC2 Instance and Helm apps"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH Access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP Traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Application App Port"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Grafana UI"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Prometheus Metrics"
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Backend Port"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS Traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "npci-forum-sg"
  }
}

# 6. S3 Bucket for Frontend Hosting and Document Storage
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket" "frontend" {
  bucket        = "${var.s3_bucket_name}-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = {
    Name = "npci-forum-s3-frontend"
  }
}

resource "aws_s3_bucket_public_access_block" "public_access" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend_policy" {
  depends_on = [aws_s3_bucket_public_access_block.public_access]
  bucket     = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# 7. EBS Volume Creation for K8s PVC / Persistent Storage
resource "aws_ebs_volume" "data_volume" {
  availability_zone = data.aws_availability_zones.available.names[0]
  size              = 20
  type              = "gp3"

  tags = {
    Name = "npci-forum-data-pvc-volume"
  }
}

# Dynamic AMI Lookup for Ubuntu 22.04 LTS
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Generate dynamic SSH key pair for EC2 (No manual SSH key needed in GitHub Secrets)
resource "tls_private_key" "ec2_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated_key" {
  key_name   = "npci-forum-auto-key"
  public_key = tls_private_key.ec2_key.public_key_openssh
}

# 8. EC2 Instance for Helm / Container Runtime
resource "aws_instance" "app_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  key_name               = aws_key_pair.generated_key.key_name

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io curl git xfsProgs
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ubuntu

              # 1. Format and Mount AWS EBS Volume for DB Persistence
              mkdir -p /data/db
              if ! blkid /dev/sdh && ! blkid /dev/xvdh && ! blkid /dev/nvme1n1; then
                mkfs -t ext4 /dev/sdh || mkfs -t ext4 /dev/xvdh || mkfs -t ext4 /dev/nvme1n1 || true
              fi
              mount /dev/sdh /data/db || mount /dev/xvdh /data/db || mount /dev/nvme1n1 /data/db || true
              chmod -R 777 /data/db

              # 2. Install K3s Kubernetes and Helm
              curl -sfL https://get.k3s.io | sh -
              curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

              # 3. Pull and run Docker containers with EBS volume persistence
              docker pull pravinnpci/npci-forum-python-backend:latest || true
              docker rm -f npci-backend || true
              docker run -d --name npci-backend -p 8000:8000 -v /data/db:/data/db --restart always pravinnpci/npci-forum-python-backend:latest || true

              docker pull pravinnpci/npci-forum-app:latest || true
              docker rm -f npci-app || true
              docker run -d --name npci-app -p 3000:3000 -v /data/db:/data/db --restart always pravinnpci/npci-forum-app:latest || true
              EOF

  tags = {
    Name = "npci-forum-ec2-instance"
  }
}

# 10. Dedicated Grafana & Prometheus Monitoring EC2 Instance
resource "aws_instance" "grafana_monitoring" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  key_name               = aws_key_pair.generated_key.key_name

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io curl
              systemctl start docker
              systemctl enable docker

              # Run Prometheus
              mkdir -p /etc/prometheus
              cat <<'PROM' > /etc/prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'npci_forum_app'
    static_configs:
      - targets: ['${data.aws_eip.existing_eip.public_ip}:3000', '${data.aws_eip.existing_eip.public_ip}:8000']
PROM

              docker rm -f prometheus || true
              docker run -d --name prometheus -p 9090:9090 -v /etc/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml --restart always prom/prometheus:latest

              # Run Grafana Server
              docker rm -f grafana || true
              docker run -d --name grafana -p 3001:3000 -e "GF_SECURITY_ADMIN_PASSWORD=admin" -e "GF_USERS_ALLOW_SIGN_UP=false" --restart always grafana/grafana:latest
              EOF

  tags = {
    Name = "npci-forum-grafana-monitoring-server"
  }
}

resource "aws_volume_attachment" "ebs_att" {
  device_name = "/dev/sdh"
  volume_id   = aws_ebs_volume.data_volume.id
  instance_id = aws_instance.app_server.id
}

# 9. Lookup Existing Elastic IP (16.112.205.103) and Associate to EC2 Instance
data "aws_eip" "existing_eip" {
  public_ip = "16.112.205.103"
}

resource "aws_eip_association" "eip_assoc" {
  instance_id   = aws_instance.app_server.id
  allocation_id = data.aws_eip.existing_eip.id
}
