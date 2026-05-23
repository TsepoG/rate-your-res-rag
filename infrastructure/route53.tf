# Reference the manually created hosted zone — do not recreate it
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# A record pointing the domain to the EC2 Elastic IP
resource "aws_route53_record" "main" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.rag.public_ip]
}

# ACM certificate for HTTPS
resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = {
    Name        = "${var.app_name}-${var.environment}-cert"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

# DNS validation record for ACM
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

# Wait for ACM certificate to be validated
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}