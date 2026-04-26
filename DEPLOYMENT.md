# Change Liberia - Deployment Guide

## Quick Start (5 minutes)

```bash
# 1. Clone and navigate
git clone <repo>
cd Change\ Liberia

# 2. Validate setup
bash scripts/validate-deployment.sh

# 3. Start services
docker compose up -d

# 4. Access services
# API:     http://localhost:4000
# Web:     http://localhost:3000
# Mailhog: http://localhost:8025
```

## Development Environment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Git
- 4GB RAM available
- 10GB disk space

### Full Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/Change-Liberia.git
cd Change\ Liberia

# 2. Create environment file
cp .env.example .env.local

# 3. Start Docker services
docker compose up -d

# 4. Monitor startup
docker compose logs -f api

# 5. Run migrations (when api is healthy)
docker compose exec api npx prisma migrate deploy

# 6. Seed database (optional)
docker compose exec api pnpm prisma:seed

# 7. Verify services
docker compose ps
```

### Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| API | http://localhost:4000 | NestJS backend |
| Web | http://localhost:3000 | Next.js frontend |
| API Docs | http://localhost:4000/api/docs | Swagger documentation |
| MailHog | http://localhost:8025 | Email testing |
| pgAdmin | http://localhost:5050 | Database management (optional) |

### Common Commands

```bash
# Start services
docker compose up -d

# Stop services (keep data)
docker compose down

# Stop and remove data
docker compose down -v

# View logs
docker compose logs -f api

# Execute command in container
docker compose exec api npx prisma migrate deploy

# Rebuild images
docker compose down
docker compose up -d --build

# Check service status
docker compose ps

# View service details
docker compose logs <service-name>
```

## Testing Email

### Using MailHog

1. Access http://localhost:8025
2. Trigger payment webhook:
   ```bash
   stripe trigger payment_intent.succeeded
   ```
3. Email appears in MailHog UI

### Configure SMTP

```bash
# In test client or application
SMTP_HOST: localhost
SMTP_PORT: 1025
SMTP_USER: (leave empty)
SMTP_PASSWORD: (leave empty)
```

## Testing Stripe Webhooks

### Setup Stripe CLI

```bash
# Download Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe account
stripe login

# Forward webhooks to local API
stripe listen --forward-to localhost:4000/api/v1/payments/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger customer.subscription.deleted
```

### Verify Webhook Processing

```bash
# Check API logs
docker compose logs -f api | grep webhook

# Look for:
# - "Webhook signature verified"
# - "Webhook event payment_intent.succeeded processed"
```

## Production Deployment

### Pre-Deployment Checklist

```bash
# 1. Environment validation
bash scripts/validate-deployment.sh

# 2. Database backup (if upgrading)
docker compose exec postgres pg_dump -U postgres liberian_voices > backup.sql

# 3. Code review
git log --oneline origin/main..HEAD

# 4. Run tests
docker compose exec api pnpm test

# 5. Build verification
docker compose build

# 6. Security scan
docker scout cves liberian-voices-api:latest
```

### Docker Image Build

```bash
# Build for production
docker build -t liberian-voices-api:1.0.0 -f apps/api/Dockerfile .

# Tag for registry
docker tag liberian-voices-api:1.0.0 registry.example.com/liberian-voices-api:1.0.0

# Push to registry
docker push registry.example.com/liberian-voices-api:1.0.0

# Verify image
docker image inspect registry.example.com/liberian-voices-api:1.0.0
```

### Environment Setup for Production

Create `.env.production`:

```bash
# Database (managed service)
DATABASE_URL=postgresql://user:pass@prod-db.rds.amazonaws.com:5432/liberian_voices

# Security
NODE_ENV=production
JWT_SECRET=<generate-with-openssl-rand-base64-32>

# Application
APP_URL=https://api.liberianvoices.org
CORS_ORIGIN=https://liberianvoices.org

# Stripe (production keys)
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

# Email (SendGrid in production)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG...

# Logging
LOG_LEVEL=warn
```

### Kubernetes Deployment

```bash
# 1. Create namespace
kubectl create namespace production

# 2. Create secrets
kubectl create secret generic db-credentials \
  --from-literal=url=$DATABASE_URL \
  -n production

kubectl create secret generic stripe-credentials \
  --from-literal=api-key=$STRIPE_API_KEY \
  --from-literal=webhook-secret=$STRIPE_WEBHOOK_SECRET \
  -n production

# 3. Apply manifests
kubectl apply -f k8s/api-deployment.yaml -n production
kubectl apply -f k8s/api-service.yaml -n production

# 4. Verify deployment
kubectl get pods -n production
kubectl logs -f deployment/liberian-voices-api -n production

# 5. Scale deployment
kubectl scale deployment/liberian-voices-api --replicas=3 -n production
```

### AWS ECS Deployment

```bash
# 1. Push image to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag liberian-voices-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/liberian-voices-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/liberian-voices-api:latest

# 2. Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 3. Create service
aws ecs create-service \
  --cluster production \
  --service-name liberian-voices-api \
  --task-definition liberian-voices-api:1 \
  --desired-count 3 \
  --launch-type FARGATE

# 4. Monitor deployment
aws ecs describe-services --cluster production --services liberian-voices-api
```

## Monitoring & Logging

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api

# Follow new logs only
docker compose logs -f --tail 0 api

# View last 100 lines
docker compose logs --tail 100 api
```

### Health Checks

```bash
# API health
curl http://localhost:4000/health

# Database health
docker compose exec postgres pg_isready -U postgres

# All services
docker compose ps
```

### Metrics (Prometheus)

API exposes metrics at `http://localhost:4000/metrics`

```bash
# Query Prometheus
# http://localhost:9090

# Example queries:
# - process_resident_memory_bytes
# - http_requests_total
# - http_request_duration_seconds
```

## Backup & Recovery

### Database Backup

```bash
# Full backup
docker compose exec postgres pg_dump -U postgres liberian_voices > backup-$(date +%Y%m%d).sql

# Compressed backup
docker compose exec postgres pg_dump -U postgres liberian_voices | gzip > backup.sql.gz

# Restore from backup
docker compose exec -T postgres psql -U postgres liberian_voices < backup.sql

# Automated daily backups (cron)
0 2 * * * cd /app && docker compose exec -T postgres pg_dump -U postgres liberian_voices | gzip > backups/db-$(date +\%Y\%m\%d).sql.gz
```

### Volume Backup

```bash
# Backup uploads
docker run --rm \
  -v liberian-voices_api_uploads:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/uploads-$(date +%Y%m%d).tar.gz -C /data .

# Restore uploads
docker run --rm \
  -v liberian-voices_api_uploads:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/uploads.tar.gz -C /data
```

## Troubleshooting

### API Won't Start

```bash
# Check logs
docker compose logs api

# Common issues:
# - Database connection: Check DATABASE_URL
# - Port already in use: Change port mapping
# - Missing environment variable: Check .env file

# Restart service
docker compose restart api
```

### Database Connection Error

```bash
# Check postgres service
docker compose logs postgres

# Test connection manually
docker compose exec postgres psql -U postgres -d liberian_voices -c "SELECT 1;"

# Recreate database
docker compose down -v
docker compose up -d postgres
docker compose exec postgres createdb -U postgres liberian_voices
```

### Out of Memory

```bash
# Check resource usage
docker stats

# Increase memory limit (in docker-compose.yml)
services:
  api:
    mem_limit: 2g

# Restart
docker compose down
docker compose up -d
```

### Email Not Sending

```bash
# Verify MailHog is running
docker compose ps mailhog

# Check SMTP settings
docker compose exec api env | grep SMTP

# Test connection
docker compose exec api npx -e "require('net').connect(1025, 'mailhog').on('connect', () => console.log('OK'))"
```

## Security Best Practices

- [ ] Use strong JWT_SECRET (32+ random chars)
- [ ] Never commit .env files
- [ ] Use environment variables for secrets
- [ ] Regular security updates: `docker pull node:latest`
- [ ] Scan images: `docker scout cves`
- [ ] Use private registry for production
- [ ] Enable HTTPS in production
- [ ] Configure firewall rules
- [ ] Monitor logs for suspicious activity
- [ ] Regular backups (test recovery)

## Performance Optimization

### Database
```sql
-- Create indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_webhooks_stripe_id ON webhook_events(stripe_event_id);
```

### Application
```bash
# Update package.json
"scripts": {
  "build:prod": "pnpm turbo run build --no-cache",
  "start:prod": "NODE_ENV=production node dist/main"
}

# Set NODE_ENV=production in docker
ENV NODE_ENV=production
```

### Docker
```bash
# Optimize image layers
# - Use .dockerignore
# - Minimize layer count
# - Use alpine base images
# - Remove unnecessary files
```

## Useful Commands

```bash
# Access database shell
docker compose exec postgres psql -U postgres -d liberian_voices

# Access API shell
docker compose exec api sh

# Run migrations
docker compose exec api npx prisma migrate deploy

# Run seeds
docker compose exec api pnpm prisma:seed

# Generate Prisma client
docker compose exec api npx prisma generate

# Run tests
docker compose exec api pnpm test

# Run lint
docker compose exec api pnpm lint

# Clean up (careful!)
docker system prune -a
```

## Documentation

- [Full Deployment Guide](apps/api/PHASE_12_4_DOCKER_DEPLOYMENT.md)
- [Phase 12.3 Email Integration](apps/api/PHASE_12_3_EMAIL_INTEGRATION.md)
- [Phase 12.2 Webhook Setup](apps/api/PHASE_12_2_SERVICE_INTEGRATION.md)
- [API Documentation](http://localhost:4000/api/docs)

## Support

For issues or questions:
1. Check logs: `docker compose logs`
2. Review documentation in PHASE files
3. Check GitHub issues
4. Contact development team

---

**Last Updated:** April 17, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
