variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "af-south-1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "rateyourres-rag"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "vpc_id" {
  description = "Default VPC ID"
  type        = string
}

variable "subnet_id" {
  description = "Default subnet ID"
  type        = string
}

variable "public_key" {
  description = "SSH public key content"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "Ubuntu 22.04 LTS AMI ID for af-south-1"
  type        = string
}