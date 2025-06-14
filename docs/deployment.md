# ExamForge v1.0 Production Deployment Guide

**Last Updated**: 2025-06-12  
**Version**: 1.0.0  
**Target Environment**: Production

## 📋 Overview

This comprehensive guide provides step-by-step instructions for deploying ExamForge v1.0 to production environments. ExamForge v1.0 is production-ready with enterprise-grade features including multi-tenant team management, Stripe billing integration, MinIO storage, and comprehensive security measures.

### 🎯 v1.0 Production Features
- **Multi-tenant Architecture**: Complete team isolation and data security
- **Stripe Billing Integration**: Production-ready payment processing with webhooks
- **Enterprise Authentication**: NextAuth.js with OAuth and session management
- **Scalable Storage**: MinIO object storage with quota management
- **Real-time Analytics**: Performance monitoring and usage tracking
- **Comprehensive Security**: CSRF protection, rate limiting, and audit logging

This deployment covers web application, PostgreSQL database, MinIO file storage, reverse proxy, SSL configuration, and monitoring setup.

## 🛡️ Prerequisites

### System Requirements

- **Server**: Ubuntu 20.04+ / CentOS 8+ / Amazon Linux 2
- **CPU**: 4+ cores (8+ recommended)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 100GB minimum SSD
- **Network**: Public IP with HTTPS support

### Required Software

- **Docker**: 24.0+
- **Docker Compose**: 2.20+
- **Node.js**: 18+ (for local builds)
- **PostgreSQL**: 14+ (if not using Docker)
- **Nginx**: Latest (for reverse proxy)
- **Certbot**: For SSL certificates

### Required Accounts & Services

- **Domain Name**: Registered domain with DNS control
- **Stripe Account**: For payment processing
- **Google OAuth**: For social authentication (optional)
- **GitHub OAuth**: For social authentication (optional)
- **MinIO/S3**: For file storage

---

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended)

#### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login to apply group changes
```

#### 2. Application Setup

```bash
# Clone repository
git clone https://github.com/moto-taka/exam-forge-online.git
cd exam-forge-online

# Create production environment file
cp .env.example .env.production
```

#### 3. Environment Configuration

Edit `.env.production` with production values:

```bash
# Application
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET="your-secure-random-secret-256-bit"

# Database
DATABASE_URL="postgresql://examforge:secure_password@postgres:5432/examforge_prod"

# Stripe (Production Keys)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-app-id"
GITHUB_SECRET="your-github-app-secret"

# Storage (MinIO Object Storage)
MINIO_ROOT_USER="examforge"
MINIO_ROOT_PASSWORD="secure_minio_password"
MINIO_ENDPOINT="http://minio:9000"
MINIO_BUCKET_NAME="examforge-media"

# Security & Rate Limiting
CSRF_SECRET="your-csrf-secret"
RATE_LIMIT_SECRET="your-rate-limit-secret"

# v1.0 New Features Configuration
# Team Management (Required for multi-tenancy)
DEFAULT_TEAM_PLAN="FREE"
MAX_FREE_TEAM_MEMBERS=3
MAX_PRO_TEAM_MEMBERS=20

# Analytics & Monitoring
ENABLE_ANALYTICS=true
ANALYTICS_RETENTION_DAYS=365

# Email Notifications (Optional but recommended)
SMTP_HOST="your-smtp-server.com"
SMTP_PORT=587
SMTP_USER="your-smtp-username"
SMTP_PASSWORD="your-smtp-password"
FROM_EMAIL="noreply@your-domain.com"

# Cache Configuration (Optional)
REDIS_URL="redis://redis:6379"

# Performance Optimization
DATABASE_CONNECTION_LIMIT=20
STORAGE_UPLOAD_LIMIT_MB=100
```

#### 4. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: ./web
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - minio
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: examforge_prod
      POSTGRES_USER: examforge
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U examforge"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: examforge
      MINIO_ROOT_PASSWORD: secure_minio_password
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
```

#### 5. Production Dockerfile

Create `web/Dockerfile.prod`:

```dockerfile
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### 6. Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

        client_max_body_size 100M;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /minio/ {
            proxy_pass http://minio:9000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### 7. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 2 * * * certbot renew --quiet
```

#### 8. Deploy Application

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate:deploy

# Seed initial data
docker-compose -f docker-compose.prod.yml exec app pnpm db:seed:master

# Check logs
docker-compose -f docker-compose.prod.yml logs -f app
```

---

## Option 2: Traditional Server Setup

### 1. Server Setup

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 for process management
npm install -g pm2
```

### 2. Database Setup

```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE examforge_prod;
CREATE USER examforge WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE examforge_prod TO examforge;
\q
```

### 3. Application Deployment

```bash
# Clone and build application
git clone https://github.com/moto-taka/exam-forge-online.git
cd exam-forge-online/web

# Install dependencies
pnpm install

# Build for production
pnpm build

# Run database migrations
pnpm db:migrate:deploy

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'examforge',
    script: 'npm',
    args: 'start',
    cwd: './web',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

---

## 🔧 Post-Deployment Configuration

### 1. Stripe Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret to environment variables

### 2. OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`

#### GitHub OAuth
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set authorization callback URL: `https://your-domain.com/api/auth/callback/github`

### 3. MinIO Configuration

```bash
# Access MinIO console
open https://your-domain.com:9001

# Create bucket and set policy
# Username: examforge
# Password: secure_minio_password
```

### 4. v1.0 New Features Configuration

#### Team Management Setup
```bash
# Verify team creation is working
curl -X POST https://your-domain.com/api/teams/create \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Team"}'

# Check team isolation (should return 404 for other teams)
curl https://your-domain.com/api/teams/unauthorized-team-id
```

#### Analytics Dashboard Setup
```bash
# Initialize analytics database tables
docker-compose exec app pnpm exec prisma db:seed

# Verify analytics endpoint
curl https://your-domain.com/api/analytics/team-stats
```

#### Stripe Billing Verification
```bash
# Test webhook endpoint
curl -X POST https://your-domain.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"type": "invoice.payment_succeeded"}'

# Verify customer portal
curl https://your-domain.com/api/stripe/portal
```

#### Performance Monitoring Setup
```bash
# Setup application monitoring
echo "Setting up monitoring endpoints..."

# Health check endpoint
curl https://your-domain.com/api/health

# Database connection check
curl https://your-domain.com/api/health/database

# Storage availability check  
curl https://your-domain.com/api/health/storage
```

---

## 📊 Monitoring & Maintenance

### 1. Health Checks

Create monitoring script `scripts/health-check.sh`:

```bash
#!/bin/bash

# Application health
curl -f https://your-domain.com/api/health || exit 1

# Database health
docker-compose exec postgres pg_isready -U examforge || exit 1

# MinIO health
curl -f http://localhost:9000/minio/health/live || exit 1

echo "All services healthy"
```

### 2. Backup Script

Create `scripts/backup.sh`:

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
docker-compose exec postgres pg_dump -U examforge examforge_prod > backups/db_backup_$DATE.sql

# MinIO backup
docker-compose exec minio mc mirror /data backups/minio_backup_$DATE/

# Cleanup old backups (keep 30 days)
find backups/ -name "*.sql" -mtime +30 -delete
find backups/ -name "minio_backup_*" -mtime +30 -exec rm -rf {} \;
```

### 3. Log Monitoring

```bash
# Set up log rotation
sudo nano /etc/logrotate.d/examforge

# Content:
/home/ubuntu/exam-forge-online/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reload examforge
    endscript
}
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clear cache and rebuild
docker-compose down
docker system prune -f
docker-compose build --no-cache
```

#### 2. Database Connection Issues
```bash
# Check database status
docker-compose logs postgres

# Reset database password
docker-compose exec postgres psql -U postgres
ALTER USER examforge PASSWORD 'new_password';
```

#### 3. SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew

# Test certificate
sudo certbot certificates
```

#### 4. Performance Issues
```bash
# Monitor resource usage
docker stats

# Check application logs
docker-compose logs -f app

# Database performance
docker-compose exec postgres psql -U examforge -c "SELECT * FROM pg_stat_activity;"
```

---

## 🔒 Security Checklist

### Pre-Launch Security Audit

#### Core Security
- [ ] **Environment Variables**: All secrets properly configured and rotated
- [ ] **SSL/TLS**: Valid certificate with A+ rating on SSL Labs
- [ ] **Database**: Access restricted to application only, no public exposure
- [ ] **Firewall**: Only necessary ports open (80, 443, 22)
- [ ] **Updates**: All system packages and dependencies up to date
- [ ] **Backups**: Automated backup system working with encrypted storage
- [ ] **Monitoring**: Health checks and alerting configured

#### v1.0 Specific Security Features
- [ ] **Team Isolation**: Multi-tenant data separation verified
- [ ] **Role-Based Access**: OWNER/ADMIN/MEMBER/VIEWER permissions tested
- [ ] **Rate Limiting**: API rate limits properly configured for all endpoints
- [ ] **CSRF Protection**: Cross-site request forgery protection enabled
- [ ] **Input Validation**: All user inputs validated with Zod schemas
- [ ] **Session Security**: NextAuth.js JWT configuration with secure cookies
- [ ] **Stripe Security**: Webhook signature verification and HTTPS endpoints
- [ ] **File Upload Security**: MinIO bucket policies and file type validation
- [ ] **Audit Logging**: Activity tracking for compliance and forensics
- [ ] **OAuth Security**: Proper redirect URI validation for Google/GitHub

#### Production Hardening
- [ ] **Database Security**: Connection encryption, credential rotation
- [ ] **Container Security**: Non-root users, minimal base images
- [ ] **Network Security**: Internal service communication encrypted
- [ ] **Secret Management**: No hardcoded secrets, proper env var handling

### Security Monitoring

```bash
# Enable UFW firewall
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

---

## 📈 Performance Optimization

### 1. Database Optimization

```sql
-- Index optimization
CREATE INDEX CONCURRENTLY idx_quiz_team_status ON "Quiz" ("teamId", "status");
CREATE INDEX CONCURRENTLY idx_question_quiz_order ON "Question" ("quizId", "order");
CREATE INDEX CONCURRENTLY idx_team_member_user ON "TeamMember" ("userId");

-- Connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
SELECT pg_reload_conf();
```

### 2. Application Optimization

```bash
# Enable Next.js caching
# Add to next.config.mjs:
export default {
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
}
```

### 3. CDN Setup (Optional)

Configure CloudFlare or similar CDN for static assets and caching.

---

## 📞 Support & Maintenance

### Support Contacts

- **Technical Issues**: Create GitHub issue
- **Security Issues**: Email security@examforge.com
- **General Support**: Email support@examforge.com

### Maintenance Schedule

- **Daily**: Automated backups and health checks
- **Weekly**: Security updates and log review
- **Monthly**: Full system audit and performance review
- **Quarterly**: Disaster recovery testing

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Domain DNS properly configured
- [ ] Stripe webhooks configured
- [ ] OAuth applications created
- [ ] Database backup plan in place

### Deployment
- [ ] Application deployed successfully
- [ ] Database migrations completed
- [ ] Health checks passing
- [ ] SSL/HTTPS working
- [ ] All services responding

### Post-Deployment
- [ ] User registration tested (all auth providers)
- [ ] Payment flow tested (Stripe checkout and webhooks)
- [ ] Quiz creation/completion tested (all 9 question types)
- [ ] File upload tested (MinIO storage integration)
- [ ] Email notifications working
- [ ] Monitoring and alerting configured

### v1.0 Feature Verification
- [ ] **Team Management**: Create/delete teams, invite members, role changes
- [ ] **Multi-tenant Isolation**: Verify data separation between teams
- [ ] **Subscription Plans**: Free/Pro/Premium plan limitations enforced
- [ ] **Analytics Dashboard**: Real-time activity timeline and usage metrics
- [ ] **Internationalization**: Japanese and English language switching
- [ ] **Question Types**: All 9 question types functional (True/False, Multiple Choice, Short Answer, Fill-in-Blank, Sorting, Matching, Diagram, Numeric)
- [ ] **Media Management**: Image/video upload with quota enforcement
- [ ] **Export Features**: CSV/Excel data export functionality
- [ ] **Mobile Responsiveness**: All features work on mobile devices
- [ ] **Performance**: Page load times under 2 seconds

---

**Deployment completed successfully! 🎉**

For ongoing support and updates, monitor the GitHub repository and follow the maintenance procedures outlined above.