output "public_ip" {
  description = "EC2 public IP address"
  value       = aws_eip.rag.public_ip
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.rag.id
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ~/.ssh/rate-your-res-rag ubuntu@${aws_eip.rag.public_ip}"
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_app_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "domain_name" {
  description = "Application domain name"
  value       = var.domain_name
}

output "certificate_arn" {
  description = "ACM certificate ARN"
  value       = aws_acm_certificate_validation.main.certificate_arn
}