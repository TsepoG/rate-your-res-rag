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