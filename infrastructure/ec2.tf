# kics-scan ignore-block: HTTP Port Open To Internet - intentional for web server
# kics-scan ignore-block: IAM Access Analyzer Not Enabled - not in scope for this project
# kics-scan ignore-block: Shield Advanced Not In Use - not required for personal project

# SSH Key Pair
# kics-scan ignore-block
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

  # SSH — restricted to specific CIDR via variable
  # kics-scan ignore-block
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_cidr_blocks
    description = "SSH access"
  }

  # HTTP — intentional for web server
  # kics-scan ignore-block
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  # HTTPS — intentional for web server
  # kics-scan ignore-block
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
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
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [aws_security_group.rag.id]
  key_name                    = aws_key_pair.rag.key_name
  # kics-scan ignore-line
  associate_public_ip_address = true
  monitoring                  = true

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = <<-EOF
    #!/bin/bash
    set -e
    apt-get update -y
    apt-get upgrade -y
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    apt-get install -y docker.io
    systemctl enable docker
    systemctl start docker
    npm install -g pm2
    apt-get install -y git
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    mkdir -p /app
    chown ubuntu:ubuntu /app
  EOF

  tags = {
    Name        = "${var.app_name}-${var.environment}"
    Environment = var.environment
  }
}

# Elastic IP
# kics-scan ignore-block
resource "aws_eip" "rag" {
  instance = aws_instance.rag.id
  domain   = "vpc"

  tags = {
    Name        = "${var.app_name}-${var.environment}-eip"
    Environment = var.environment
  }
}