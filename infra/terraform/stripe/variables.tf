variable "webhook_url" {
  description = "The URL for Stripe webhooks"
  type        = string
  default     = "https://localhost:3000/api/stripe/webhook" # Update for production
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "ExamForge"
}

variable "team_member_tax_rate" {
  description = "Tax rate for team member pricing (e.g., 0.1 for 10%)"
  type        = number
  default     = 0.1 # 10% consumption tax in Japan
}