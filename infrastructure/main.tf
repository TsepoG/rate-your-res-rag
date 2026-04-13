terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "rateyourres-terraform-state"
    region         = "af-south-1"
    dynamodb_table = "rateyourres-terraform-locks"
    encrypt        = true
    # key is passed dynamically via -backend-config
  }
}

provider "aws" {
  region = var.aws_region
}