# Stripe Infrastructure Setup

This directory contains Terraform configuration for managing Stripe products, prices, and webhook endpoints across different environments.

## Prerequisites

1. Stripe API keys for each environment
2. Terraform installed (v1.0+)
3. Environment variables configured

## Environment Setup

### 1. Create Environment Variables

Create a `.env` file in the project root with:

```bash
# Development
STRIPE_SECRET_KEY_DEV=sk_test_...
STRIPE_PUBLISHABLE_KEY_DEV=pk_test_...

# Staging  
STRIPE_SECRET_KEY_STAGING=sk_test_...
STRIPE_PUBLISHABLE_KEY_STAGING=pk_test_...

# Production
STRIPE_SECRET_KEY_PROD=sk_live_...
STRIPE_PUBLISHABLE_KEY_PROD=pk_live_...
```

### 2. Initialize Terraform

```bash
cd infra/terraform/stripe
terraform init
```

### 3. Deploy to Environment

#### Development
```bash
terraform workspace new dev || terraform workspace select dev
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

#### Staging
```bash
terraform workspace new staging || terraform workspace select staging  
terraform plan -var-file=environments/staging.tfvars
terraform apply -var-file=environments/staging.tfvars
```

#### Production
```bash
terraform workspace new prod || terraform workspace select prod
terraform plan -var-file=environments/prod.tfvars
terraform apply -var-file=environments/prod.tfvars
```

## Output

After applying, Terraform will output:

- Product IDs
- Price IDs
- Webhook endpoint details
- Portal configuration ID

Save these values to your application's environment variables:

```bash
# From Terraform output
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PORTAL_CONFIGURATION_ID=bpc_...
```

## Webhook Configuration

The webhook endpoint is automatically configured for each environment:

- **Dev**: `https://examforge-dev.ngrok.io/api/stripe/webhook`
- **Staging**: `https://staging.examforge.app/api/stripe/webhook`
- **Production**: `https://examforge.app/api/stripe/webhook`

Events subscribed:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## Testing

### Local Development

1. Use Stripe CLI for webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

2. Test checkout flow:
```bash
stripe trigger checkout.session.completed
```

### Test Cards

- Success: `4242 4242 4242 4242`
- Requires authentication: `4000 0025 0000 3155`
- Declined: `4000 0000 0000 9995`

## Pricing Structure

### Pro Plan
- Monthly: ¥2,980 per member
- Yearly: ¥29,800 per member (17% discount)

### Premium Plan  
- Monthly: ¥4,980 per member
- Yearly: ¥49,800 per member (17% discount)

## Maintenance

### Updating Prices

1. Update the Terraform configuration
2. Run `terraform plan` to preview changes
3. Run `terraform apply` to create new prices
4. Update application environment variables with new price IDs

### Webhook Secret Rotation

1. Generate new webhook secret in Stripe Dashboard
2. Update environment variable
3. Deploy application with new secret
4. Verify webhook is working
5. Remove old secret