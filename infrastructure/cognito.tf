resource "aws_cognito_user_pool" "main" {
  name = "${var.app_name}-${var.environment}"

  # Self-registration enabled (no admin-only creation)
  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  # Email as the username
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  mfa_configuration        = "OPTIONAL"

  # Email verification message
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "RateYourRes RAG — Your verification code"
    email_message        = "Your verification code is {####}"
  }

  # Password policy
  password_policy {
    minimum_length                   = 8
    require_uppercase                = true
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  # Forgot password — email-based recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Token validity
  user_pool_add_ons {
    advanced_security_mode = "OFF"
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-user-pool"
    Environment = var.environment
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.app_name}-${var.environment}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # No client secret — React SPA cannot safely store secrets
  generate_secret = false

  # Auth flows — SRP is secure browser-based auth
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  # Callback + logout URLs
  callback_urls = [var.cognito_callback_url]
  logout_urls   = [var.cognito_callback_url]

  # Token validity
  access_token_validity  = 1   # hours
  id_token_validity      = 1   # hours
  refresh_token_validity = 30  # days

  # kics-scan ignore-block
  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Prevent user existence errors leaking (security best practice)
  prevent_user_existence_errors = "ENABLED"
}