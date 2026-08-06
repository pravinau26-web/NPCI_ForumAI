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
    description = "MCP Server Port"
    from_port   = 8001
    to_port     = 8001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "PostgreSQL DB Port"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Vector DB Engine Port"
    from_port   = 6333
    to_port     = 6333
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
resource "aws_ebs_volume" "data_volume_v2" {
  availability_zone = data.aws_availability_zones.available.names[0]
  size              = 10
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

# 8. EC2 Instance 1: Primary Application Node (Web App, AI Backend, MCP Server, PostgreSQL)
resource "aws_instance" "app_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  key_name               = aws_key_pair.generated_key.key_name

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io curl git xfsProgs
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ubuntu

              # Clean dangling images & stopped containers
              docker system prune -af || true

              # Install lightweight K3s Kubernetes cluster for pod management
              curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644 || true

              # 1. Format and Mount AWS EBS Volume for DB Persistence
              mkdir -p /data/db
              if ! blkid /dev/sdh && ! blkid /dev/xvdh && ! blkid /dev/nvme1n1; then
                mkfs -t ext4 /dev/sdh || mkfs -t ext4 /dev/xvdh || mkfs -t ext4 /dev/nvme1n1 || true
              fi
              mount /dev/sdh /data/db || mount /dev/xvdh /data/db || mount /dev/nvme1n1 /data/db || true
              mkdir -p /data/db/postgres /data/db/uploads
              chmod -R 777 /data/db

              # 2. Run App Core Services cleanly
              docker rm -f npci-postgres npci-backend npci-app || true
              docker pull postgres:15-alpine || true
              docker run -d --name npci-postgres -p 5432:5432 -e POSTGRES_DB=npci_forum -e POSTGRES_USER=npci_user -e POSTGRES_PASSWORD=npci_password -v /data/db/postgres:/var/lib/postgresql/data --restart always postgres:15-alpine || true

              docker pull pravinnpci/npci-forum-python-backend:latest || true
              docker run -d --name npci-backend -p 8000:8000 -v /data/db:/data/db --restart always pravinnpci/npci-forum-python-backend:latest || true

              docker pull pravinnpci/npci-forum-app:latest || true
              docker run -d --name npci-app -p 3000:3000 -v /data/db:/data/db --restart always pravinnpci/npci-forum-app:latest || true
              EOF

  tags = {
    Name = "npci-forum-app-node"
  }
}

# 9. EC2 Instance 2: Dedicated Monitoring & Vector DB Node (Prometheus, Grafana, Vector DB RAG Store)
resource "aws_instance" "monitoring_vector_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  key_name               = aws_key_pair.generated_key.key_name

  root_block_device {
    volume_size           = 10
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io curl git
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ubuntu

              mkdir -p /data/vector /etc/prometheus
              chmod -R 777 /data/vector

              # 1. Run Vector DB & MCP Server for Document Chunks RAG
              docker pull qdrant/qdrant:latest || true
              docker rm -f npci-vector-db || true
              docker run -d --name npci-vector-db -p 6333:6333 -v /data/vector:/qdrant/storage --restart always qdrant/qdrant:latest || true

              docker pull pravinnpci/npci-forum-mcp:latest || true
              docker rm -f npci-mcp || true
              docker run -d --name npci-mcp -p 8001:8000 -v /data/vector:/data/vector --restart always pravinnpci/npci-forum-mcp:latest || true

              # 2. Setup Prometheus Monitoring
              cat <<'PROM' > /etc/prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'npci_forum_services'
    static_configs:
      - targets: ['16.112.205.103:3000', '16.112.205.103:8000', '16.112.205.103:8001', '16.112.205.103:5432']
PROM

              docker pull prom/prometheus:latest || true
              docker rm -f prometheus || true
              docker run -d --name prometheus -p 9090:9090 -v /etc/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml --restart always prom/prometheus:latest || true

              # 3. Setup Grafana Dashboard with Prometheus Datasource
              mkdir -p /etc/grafana/provisioning/datasources
              cat <<'GRAF' > /etc/grafana/provisioning/datasources/prometheus.yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
GRAF

              docker pull grafana/grafana:latest || true
              docker rm -f grafana || true
              docker run -d --name grafana -p 3001:3000 -e "GF_SECURITY_ADMIN_PASSWORD=admin" -e "GF_USERS_ALLOW_SIGN_UP=false" -v /etc/grafana/provisioning:/etc/grafana/provisioning --restart always grafana/grafana:latest || true
              EOF

  tags = {
    Name = "npci-forum-monitoring-vector-node"
  }
}

resource "aws_volume_attachment" "ebs_att" {
  device_name = "/dev/sdh"
  volume_id   = aws_ebs_volume.data_volume_v2.id
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
