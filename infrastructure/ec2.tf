# SSH Key Pair
resource "aws_key_pair" "rag" {
  key_name   = "${var.app_name}-${var.environment}"
  public_key = var.public_key

  tags = {
    Name        = "${var.app_name}-${var.environment}-key"
    Environment = var.environment
  }
}

# Security Group
resource "aws_security_group" "rag" {
  name        = "${var.app_name}-${var.environment}-sg"
  description = "Security group for RateYourRes RAG server"
  vpc_id      = var.vpc_id

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  # Node.js server direct access (useful during dev)
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Node.js server"
  }

  # All outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-sg"
    Environment = var.environment
  }
}

# EC2 Instance
resource "aws_instance" "rag" {
  ami                         = var.ami_id # Ubuntu 22.04 LTS af-south-1
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [aws_security_group.rag.id]
  key_name                    = aws_key_pair.rag.key_name
  associate_public_ip_address = true

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Update system
    apt-get update -y
    apt-get upgrade -y

    # Install Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs

    # Install Docker
    apt-get install -y docker.io
    systemctl enable docker
    systemctl start docker

    # Install PM2
    npm install -g pm2

    # Install Git
    apt-get install -y git

    # Install Nginx
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx

    # Create app directory
    mkdir -p /app
    chown ubuntu:ubuntu /app
  EOF

  tags = {
    Name        = "${var.app_name}-${var.environment}"
    Environment = var.environment
  }
}

# Elastic IP
resource "aws_eip" "rag" {
  instance = aws_instance.rag.id
  domain   = "vpc"

  tags = {
    Name        = "${var.app_name}-${var.environment}-eip"
    Environment = var.environment
  }
}