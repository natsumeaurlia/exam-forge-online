terraform {
  required_version = ">= 1.0"
  
  required_providers {
    stripe = {
      source  = "lukasaron/stripe"
      version = "~> 1.0"
    }
  }
}

# Stripe Provider Configuration
provider "stripe" {
  # api_key will be set via environment variable STRIPE_API_KEY
}

# Variables
variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "currency" {
  description = "Default currency for products"
  type        = string
  default     = "jpy"
}

# Products
resource "stripe_product" "free_plan" {
  name        = "ExamForge Free Plan"
  description = "個人利用向けの無料プラン"
  active      = true
  
  metadata = {
    environment = var.environment
    plan_type   = "FREE"
  }
}

resource "stripe_product" "pro_plan" {
  name        = "ExamForge Pro Plan"
  description = "チーム向けのプロフェッショナルプラン"
  active      = true
  
  metadata = {
    environment = var.environment
    plan_type   = "PRO"
  }
}

resource "stripe_product" "enterprise_plan" {
  name        = "ExamForge Enterprise Plan"
  description = "大規模組織向けのエンタープライズプラン"
  active      = true
  
  metadata = {
    environment = var.environment
    plan_type   = "ENTERPRISE"
  }
}

# Prices for Pro Plan
resource "stripe_price" "pro_monthly" {
  product     = stripe_product.pro_plan.id
  currency    = var.currency
  unit_amount = 2980 # ¥2,980 per user per month
  
  recurring = {
    interval       = "month"
    interval_count = 1
  }
  
  metadata = {
    environment   = var.environment
    billing_cycle = "MONTHLY"
  }
}

resource "stripe_price" "pro_yearly" {
  product     = stripe_product.pro_plan.id
  currency    = var.currency
  unit_amount = 29760 # ¥29,760 per user per year
  
  recurring = {
    interval       = "year"
    interval_count = 1
  }
  
  metadata = {
    environment   = var.environment
    billing_cycle = "YEARLY"
  }
}

# Webhook Endpoint
resource "stripe_webhook_endpoint" "exam_forge_webhook" {
  url = var.webhook_url
  
  enabled_events = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
    "invoice.payment_failed",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
  ]
  
  metadata = {
    environment = var.environment
  }
}

# Customer Portal Configuration
resource "stripe_portal_configuration" "exam_forge_portal" {
  business_profile {
    headline = "ExamForge サブスクリプション管理"
  }
  
  features {
    customer_update {
      enabled         = true
      allowed_updates = ["email", "name", "address", "phone", "tax_id"]
    }
    
    invoice_history {
      enabled = true
    }
    
    payment_method_update {
      enabled = true
    }
    
    subscription_cancel {
      enabled = true
      
      cancellation_reason {
        enabled = true
        options = [
          "too_expensive",
          "missing_features",
          "switched_service",
          "unused",
          "other"
        ]
      }
    }
    
    subscription_update {
      enabled = true
      products = [
        {
          product = stripe_product.pro_plan.id
          prices  = [stripe_price.pro_monthly.id, stripe_price.pro_yearly.id]
        }
      ]
      
      proration_behavior = "create_prorations"
    }
  }
  
  metadata = {
    environment = var.environment
  }
}

# Outputs
output "free_plan_product_id" {
  value = stripe_product.free_plan.id
}

output "pro_plan_product_id" {
  value = stripe_product.pro_plan.id
}

output "enterprise_plan_product_id" {
  value = stripe_product.enterprise_plan.id
}

output "pro_monthly_price_id" {
  value = stripe_price.pro_monthly.id
}

output "pro_yearly_price_id" {
  value = stripe_price.pro_yearly.id
}

output "webhook_endpoint_id" {
  value = stripe_webhook_endpoint.exam_forge_webhook.id
}

output "webhook_endpoint_secret" {
  value     = stripe_webhook_endpoint.exam_forge_webhook.secret
  sensitive = true
}

output "portal_configuration_id" {
  value = stripe_portal_configuration.exam_forge_portal.id
}