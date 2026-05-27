# Production Deployment Execution Guide
**Date:** May 27, 2026
**Status:** Ready for Execution
**Estimated Duration:** 4-6 hours (with DNS propagation delays)

---

## 🚀 Task 1: Deploy to Production - Push to Production Server

### Pre-Deployment Checklist

#### Verify Production Configuration
```bash
# 1. Check environment configuration is set
cd /Users/visionalventure/Change\ Liberia
bash scripts/validate-production-config.sh
```

**Expected Output:**
```
✅ NODE_ENV = production
✅ DATABASE_URL is set
✅ REDIS_URL is set
✅ JWT_SECRET is set
✅ RESEND_API_KEY = re_3puwiQi1_... ✓
✅ MAIL_FROM = noreply@changeliberia.org
```

#### Production Environment Status
- ✅ DATABASE_URL: PostgreSQL on Railway configured
- ✅ REDIS_URL: Redis on Railway configured
- ✅ JWT_SECRET: Generated and set
- ✅ RESEND_API_KEY: API key configured
- ✅ Email domain: Ready for DNS verification
- ⏳ Production domain (DNS): Needs verification
- ⏳ Monitoring: To be configured
- ⏳ Admin user: To be created

### Deployment Options

#### Option A: Railway.app (Recommended - Already Configured ⭐)

**Current Status:** Rail way environment already has DATABASE_URL and REDIS_URL configured

**Steps:**

1. **Verify Railway Project Connection**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project (or use existing link)
railway link

# View current services
railway status
```

2. **Deploy API to Railway**
```bash
# Push code to main branch (Railway auto-deploys)
git add .
git commit -m "Production deployment: Complete email system, admin portal, monitoring"
git push origin main

# Monitor deployment
railway up

# View deployment logs
railway logs --service api
```

3. **Deploy Frontend to Vercel** (Alternative: Railway)
```bash
# Option A: Vercel (faster for Next.js)
npm install -g vercel
vercel --prod

# Option B: Railway
# Add Next.js service in Railway dashboard:
# - Service: Web (Next.js)
# - Environment: Copy vars from API service
# - Deploy
```

4. **Run Database Migrations**
```bash
# Via Railway CLI
railway exec npm run migrate:prod

# Or remote command
DATABASE_URL="postgresql://..." npm run migrate:prod
```

5. **Verify Deployment**
```bash
# Check API health
curl https://api.changeliberia.org/health

# Check Web health  
curl https://changeliberia.org/

# View logs
railway logs --service api
railway logs --service web
```

#### Option B: Docker + Your Server

**Prerequisites:**
- VPS with Docker installed (AWS EC2, DigitalOcean, Linode, etc.)
- SSH access to server

**Steps:**

1. **Build and Push Docker Images**
```bash
# Build
docker build -t changeliberia-api:prod apps/api/
docker build -t changeliberia-web:prod apps/web/

# Tag for registry (Docker Hub, ECR, etc.)
docker tag changeliberia-api:prod yourregistry/changeliberia-api:prod
docker tag changeliberia-web:prod yourregistry/changeliberia-web:prod

# Push
docker push yourregistry/changeliberia-api:prod
docker push yourregistry/changeliberia-web:prod
```

2. **SSH to Production Server**
```bash
ssh user@your-production-server.com
```

3. **Deploy with Docker Compose**
```bash
# Pull latest code
git clone https://github.com/officialrosha-lab/changeliberia.git
cd changeliberia

# Create production docker-compose
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  api:
    image: yourregistry/changeliberia-api:prod
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...
      - RESEND_API_KEY=re_...
      # ... all env vars from .env.production
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    image: yourregistry/changeliberia-web:prod
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.changeliberia.org
    restart: always

  postgres:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7
    restart: always

volumes:
  postgres_data:
EOF

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Check services
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f api
```

4. **Setup SSL with Nginx**
```bash
# Install Nginx and Let's Encrypt
sudo apt-get install nginx certbot python3-certbot-nginx

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/changeliberia.org
# (Add config below)

# Get SSL certificate
sudo certbot certonly --standalone -d changeliberia.org -d api.changeliberia.org

# Enable HTTPS
sudo nginx -t
sudo systemctl reload nginx
```

**Nginx Configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name api.changeliberia.org;

    ssl_certificate /etc/letsencrypt/live/changeliberia.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/changeliberia.org/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name changeliberia.org;

    ssl_certificate /etc/letsencrypt/live/changeliberia.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/changeliberia.org/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name changeliberia.org api.changeliberia.org;
    return 301 https://$server_name$request_uri;
}
```

### Post-Deployment Verification

```bash
# 1. Verify API is healthy
curl https://api.changeliberia.org/health
# Expected: {"status":"ok","timestamp":"2026-05-27T..."}

# 2. Verify Web is accessible
curl -I https://changeliberia.org
# Expected: HTTP/2 200

# 3. Check database connectivity
curl -X GET https://api.changeliberia.org/api/v1/petitions/stats \
  -H "Content-Type: application/json"
# Expected: {"totalPetitions":...}

# 4. Check email service is running
# (Will verify in Task 3)
```

---

## 👤 Task 2: Create Admin User - Set Up Production Admin Account

### Option A: Via Seed Script (Recommended)

The seed script in `seed.ts` creates a default admin user:

```bash
# Connect to production database and run seed
DATABASE_URL="postgresql://..." npx prisma db seed
```

**Default Admin User Created:**
- **Name:** Satta K. Doe
- **Phone:** +231770000001
- **Email:** satta@example.com
- **Role:** ADMIN
- **Password:** (Needs to be set via signup/password reset)

### Option B: Manual Database Insert

```bash
# Connect to production database
psql "postgresql://postgres:password@host:port/database"

-- Create admin user
INSERT INTO "User" (
  id,
  "fullName",
  phone,
  email,
  "passwordHash",
  role,
  "trustScore",
  "verificationStatus",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Satta K. Doe',
  '+231770000001',
  'satta@example.com',
  'hash_placeholder',  -- Will be updated on first login
  'ADMIN',
  70,
  'VERIFIED_LIBERIAN',
  NOW(),
  NOW()
);

-- Verify user was created
SELECT id, email, role FROM "User" WHERE email = 'satta@example.com';
```

### Option C: Via Admin API (Post-Deployment)

Once the admin is created with default password via Option A:

1. **Initial Login with Default Credentials**
```bash
curl -X POST https://api.changeliberia.org/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneOrEmail": "satta@example.com",
    "password": "initial_password"
  }'

# Response:
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "fullName": "Satta K. Doe",
    "email": "satta@example.com",
    "role": "ADMIN"
  }
}
```

2. **Change Password**
```bash
curl -X POST https://api.changeliberia.org/api/v1/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "initial_password",
    "newPassword": "secure_new_password_123!"
  }'
```

### Option D: Create Additional Admin Users

Via admin dashboard (once logged in):

1. Go to https://changeliberia.org/admin
2. Click "Users" tab
3. Click "Create Admin User"
4. Fill form:
   - Full Name
   - Email
   - Phone
   - Temporary Password (user should change on first login)
5. Click "Create"

**Verification:**
```bash
# List all admin users
curl https://api.changeliberia.org/api/v1/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Expected response includes all admin users with role="ADMIN"
```

---

## 📧 Task 3: Send Test Email - Verify End-to-End Delivery

### Pre-Test Checklist

- ✅ Production API is deployed and running
- ✅ Production database is connected
- ✅ Redis is connected and operational
- ✅ Admin user is created and logged in
- ⏳ Email domain is verified in Resend (24-48 hours for DNS)

### Step 1: Verify Resend Domain Setup

1. **Log into Resend Dashboard**
   - Go to https://resend.com
   - Navigate to "Domains"
   - Verify domain status:
     - ✅ Domain added
     - ✅ DNS records configured (SPF, DKIM, CNAME)
     - ✅ Status = "Verified"

2. **If Domain Not Yet Verified:**
   - Copy DNS records from Resend
   - Add to your domain provider (Namecheap, GoDaddy, Route 53, etc.)
   - Wait 5-30 minutes for DNS propagation
   - Click "Verify" in Resend

### Step 2: Send Test Email via API

**Test 1: Welcome Email to Any User**
```bash
# Get admin token first
TOKEN=$(curl -s -X POST https://api.changeliberia.org/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneOrEmail": "satta@example.com",
    "password": "your_admin_password"
  }' | jq -r '.access_token')

# Send test welcome email
curl -X POST https://api.changeliberia.org/api/v1/email/test-send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "your-test-email@gmail.com",
    "emailType": "WELCOME",
    "props": {
      "fullName": "Test User",
      "verificationLink": "https://changeliberia.org/verify/token123"
    }
  }'

# Expected response:
{
  "jobId": "job_abc123",
  "status": "queued",
  "message": "Email queued for delivery"
}
```

**Test 2: Signature Received Email**
```bash
curl -X POST https://api.changeliberia.org/api/v1/email/test-send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "your-test-email@gmail.com",
    "emailType": "SIGNATURE_RECEIVED",
    "props": {
      "signerName": "Test Signer",
      "petitionTitle": "Fix Community Roads",
      "totalSignatures": 1240
    }
  }'
```

**Test 3: Petition Approved Email**
```bash
curl -X POST https://api.changeliberia.org/api/v1/email/test-send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "your-test-email@gmail.com",
    "emailType": "PETITION_APPROVED",
    "props": {
      "petitionTitle": "Fix Sinkor Community Roads Before Rainy Season",
      "petitionUrl": "https://changeliberia.org/petitions/123"
    }
  }'
```

### Step 3: Verify Email Delivery

**Option A: Check Resend Dashboard**
1. Go to https://resend.com/emails
2. Look for emails sent from noreply@changeliberia.org
3. Status should show "Delivered" or "Opened"

**Option B: Check Email Logs via API**
```bash
curl https://api.changeliberia.org/api/v1/email/logs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Response includes all sent emails with status
{
  "logs": [
    {
      "id": "log_123",
      "recipientEmail": "your-test-email@gmail.com",
      "emailType": "WELCOME",
      "status": "DELIVERED",
      "sentAt": "2026-05-27T14:30:00Z",
      "openedAt": null,
      "clickedAt": null
    }
  ]
}
```

**Option C: Database Query**
```bash
# Connect to production database
psql "DATABASE_URL"

-- Check email logs
SELECT 
  id, 
  "recipientEmail", 
  "emailType", 
  status, 
  "sentAt", 
  "openedAt"
FROM "EmailLog" 
WHERE "sentAt" > NOW() - INTERVAL '1 hour'
ORDER BY "sentAt" DESC
LIMIT 10;

-- Expected output:
-- | id | recipientEmail | emailType | status | sentAt | openedAt |
-- |  1 | your@email.com | WELCOME  | DELIVERED | 2026-05-27 14:30 | NULL |
```

### Step 4: Test Email Preference Management

```bash
# Get user's email preferences
curl https://api.changeliberia.org/api/v1/email/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Response:
{
  "emailEnabled": true,
  "digestFrequency": "WEEKLY",
  "mutedTypes": [],
  "emailCategories": {
    "authentication": true,
    "petitions": true,
    "community": true,
    "donations": true,
    "marketing": false
  }
}

# Update preferences (disable marketing emails)
curl -X PATCH https://api.changeliberia.org/api/v1/email/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailCategories": {
      "authentication": true,
      "petitions": true,
      "community": true,
      "donations": true,
      "marketing": false
    }
  }'
```

### Troubleshooting

**Email Not Delivered After 5 Minutes**
```bash
# Check Redis queue status
redis-cli -u "redis://..." INFO stats

# Check BullMQ job status
curl https://api.changeliberia.org/api/v1/email/queue-status \
  -H "Authorization: Bearer $TOKEN"

# Response should show:
{
  "queued": 0,
  "processing": 0,
  "completed": 1,
  "failed": 0
}
```

**"Domain not verified" Error**
- Go to Resend dashboard
- Verify all DNS records are added to your domain provider
- Wait for DNS propagation (check with: `dig changeliberia.org TXT`)

**"Redis connection failed"**
- Verify REDIS_URL in production environment
- Check Redis service is running: `redis-cli ping`
- Verify network connectivity to Redis host

---

## 📊 Task 4: Set Up Monitoring - Configure Alerts for Email Failures

### Part 1: Database Monitoring

**Option A: Built-in Email Log Queries**

```bash
# 1. Monitor delivery rate (hourly)
HOURLY_DELIVERED=$(psql -t "DATABASE_URL" -c "
  SELECT COUNT(*) FROM \"EmailLog\" 
  WHERE status = 'DELIVERED' 
  AND \"sentAt\" > NOW() - INTERVAL '1 hour'
")

HOURLY_TOTAL=$(psql -t "DATABASE_URL" -c "
  SELECT COUNT(*) FROM \"EmailLog\" 
  WHERE \"sentAt\" > NOW() - INTERVAL '1 hour'
")

DELIVERY_RATE=$((HOURLY_DELIVERED * 100 / HOURLY_TOTAL))

echo "Hourly Delivery Rate: ${DELIVERY_RATE}%"
```

**Option B: Prometheus Metrics**

Enable Prometheus monitoring (already configured in NestJS):

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'changeliberia-api'
    static_configs:
      - targets: ['api.changeliberia.org:9090']

  - job_name: 'changeliberia-email'
    static_configs:
      - targets: ['api.changeliberia.org:9091']
```

Queries:
```
# Email queue size
bull_queue_count{job="changeliberia-email"}

# Email delivery success rate (last hour)
rate(email_delivered_total[1h])

# Email delivery latency (p95)
histogram_quantile(0.95, email_delivery_duration_seconds)
```

### Part 2: Set Up Email Failure Alerts

**Option A: Simple Bash Monitoring Script**

Create [scripts/monitor-email.sh](scripts/monitor-email.sh):

```bash
#!/bin/bash
# Email System Monitoring Script
# Run via cron every 15 minutes: */15 * * * * bash /path/to/monitor-email.sh

set -e

# Configuration
ALERT_EMAIL="ops@changeliberia.org"
PROD_DB_URL="${DATABASE_URL}"
THRESHOLD_FAILURE_RATE=5  # Alert if > 5% failure rate

# Get metrics from last hour
TOTAL=$(psql -t "$PROD_DB_URL" -c "
  SELECT COUNT(*) FROM \"EmailLog\" 
  WHERE \"sentAt\" > NOW() - INTERVAL '1 hour'
")

FAILED=$(psql -t "$PROD_DB_URL" -c "
  SELECT COUNT(*) FROM \"EmailLog\" 
  WHERE status = 'FAILED' 
  AND \"sentAt\" > NOW() - INTERVAL '1 hour'
")

if [ "$TOTAL" -eq 0 ]; then
  echo "No emails sent in last hour - no data to monitor"
  exit 0
fi

FAILURE_RATE=$((FAILED * 100 / TOTAL))

# Alert if failure rate exceeds threshold
if [ "$FAILURE_RATE" -gt "$THRESHOLD_FAILURE_RATE" ]; then
  cat > /tmp/email_alert.txt << EOF
🚨 EMAIL DELIVERY ALERT

Failure Rate: ${FAILURE_RATE}% (Threshold: ${THRESHOLD_FAILURE_RATE}%)
Failed Emails: ${FAILED} of ${TOTAL}
Time Window: Last 1 hour

Recent Failures:
$(psql -t "$PROD_DB_URL" -c "
  SELECT \"recipientEmail\", \"errorMessage\", \"sentAt\" 
  FROM \"EmailLog\" 
  WHERE status = 'FAILED' 
  AND \"sentAt\" > NOW() - INTERVAL '1 hour'
  ORDER BY \"sentAt\" DESC
  LIMIT 5
")

Action Required:
1. Check email service logs: docker logs api
2. Verify Resend API status: https://status.resend.com
3. Check RESEND_API_KEY is correct in .env.production
4. Verify domain is verified in Resend dashboard
5. Check Redis connection: redis-cli ping
EOF

  # Send alert
  mail -s "🚨 Change Liberia Email Delivery Alert - ${FAILURE_RATE}% Failure Rate" \
    "$ALERT_EMAIL" < /tmp/email_alert.txt
  
  echo "Alert sent to $ALERT_EMAIL"
fi

echo "✓ Email monitoring check completed - Failure Rate: ${FAILURE_RATE}%"
```

Make executable and add to cron:
```bash
chmod +x scripts/monitor-email.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "*/15 * * * * cd /Users/visionalventure/Change\ Liberia && bash scripts/monitor-email.sh") | crontab -
```

**Option B: Uptime.com or Similar Service**

1. Sign up at https://uptime.com (free tier available)
2. Add monitoring point:
   - URL: `https://api.changeliberia.org/health`
   - Interval: Every 5 minutes
   - Alert threshold: 2 consecutive failures
3. Configure alerts:
   - Email: ops@changeliberia.org
   - SMS (optional): +1-555-123-4567
   - Webhook (optional): https://slack.com/api/...

**Option C: Grafana Dashboard**

```bash
# 1. Install Grafana (Docker)
docker run -d \
  -p 3001:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD=admin \
  grafana/grafana

# 2. Add data source (Prometheus)
# http://localhost:3001 → Configuration → Data Sources → Prometheus

# 3. Create dashboard with panels:
# - Email delivery rate (gauge)
# - Failed emails (graph)
# - Queue depth (gauge)
# - Delivery latency p95 (graph)
```

### Part 3: Set Up Queue Monitoring

**Check BullMQ Queue Status**

```bash
# Via API endpoint
curl https://api.changeliberia.org/api/v1/email/queue-status \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Response:
{
  "queue": {
    "name": "email",
    "counts": {
      "waiting": 12,
      "active": 2,
      "completed": 5432,
      "failed": 8,
      "delayed": 3
    },
    "isPaused": false
  },
  "workers": {
    "active": 2,
    "concurrency": 5
  }
}
```

**Clear Failed Jobs**

```bash
# Via admin API
curl -X POST https://api.changeliberia.org/api/v1/admin/email/retry-failed \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Response:
{
  "retried": 8,
  "message": "8 failed emails queued for retry"
}
```

### Part 4: Configure Alert Escalation

**Escalation Matrix:**

| Alert Level | Threshold | Action | Escalate After |
|-----------|-----------|--------|-----------------|
| **Warning** | 2-5% failure | Email ops@ | 30 min |
| **Critical** | 5-10% failure | Email + SMS ops@ | 10 min |
| **Severe** | >10% failure | Email + SMS + Page on-call | 5 min |

**Create escalation script**:

```bash
#!/bin/bash
# scripts/escalate-alert.sh

FAILURE_RATE=$1
TIMESTAMP=$(date -Iseconds)

if [ "$FAILURE_RATE" -gt 10 ]; then
  # Severe: Page on-call engineer
  curl -X POST https://api.pagerduty.com/incidents \
    -H "Authorization: Token token=YOUR_PAGERDUTY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"incident\": {
        \"type\": \"incident\",
        \"title\": \"🚨 SEVERE: Email delivery failure ${FAILURE_RATE}%\",
        \"urgency\": \"high\",
        \"body\": {
          \"type\": \"incident_body\",
          \"details\": \"Email failure rate exceeded 10% at $TIMESTAMP\"
        }
      }
    }"

elif [ "$FAILURE_RATE" -gt 5 ]; then
  # Critical: SMS + Email
  twilio_send_sms "Critical: Email failure rate ${FAILURE_RATE}%" "ops_phone"
  
else
  # Warning: Email only
  echo "Warning: Email failure rate ${FAILURE_RATE}%"
fi
```

---

## 📚 Task 5: Document Runbooks - Create Ops Procedures

### Runbook 1: Daily Operations Checklist

Create [docs/RUNBOOK_DAILY_OPERATIONS.md](docs/RUNBOOK_DAILY_OPERATIONS.md):

```markdown
# Daily Operations Runbook

## Morning Checklist (8 AM)

- [ ] **API Health Check**
  \`\`\`bash
  curl -I https://api.changeliberia.org/health
  \`\`\`
  Expected: HTTP 200 OK

- [ ] **Database Status**
  \`\`\`bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
  \`\`\`

- [ ] **Redis Status**
  \`\`\`bash
  redis-cli -u $REDIS_URL ping
  \`\`\`
  Expected: PONG

- [ ] **Email Queue Depth**
  \`\`\`bash
  curl https://api.changeliberia.org/api/v1/email/queue-status \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  \`\`\`
  Expected: waiting < 50, failed < 5

- [ ] **Email Delivery Rate (Last Hour)**
  \`\`\`bash
  psql $DATABASE_URL -c "
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
      ROUND(100.0 * SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) / COUNT(*), 2) as delivery_rate
    FROM \"EmailLog\"
    WHERE \"sentAt\" > NOW() - INTERVAL '1 hour';"
  \`\`\`
  Expected: delivery_rate > 95%

## End-of-Day Checklist (5 PM)

- [ ] **Email Summary Report**
- [ ] **Backup Database**
- [ ] **Check Alert Log** for any unresolved issues
```

### Runbook 2: Incident Response

Create [docs/RUNBOOK_INCIDENT_RESPONSE.md](docs/RUNBOOK_INCIDENT_RESPONSE.md):

```markdown
# Incident Response Runbook

## Incident: Email Service Down

### Detection
- Alert: Email delivery rate < 50% for > 5 minutes
- Customer report: Emails not arriving

### Immediate Actions (0-5 min)

1. **Acknowledge Incident**
   - Log in to monitoring dashboard
   - Create incident ticket
   - Notify ops team

2. **Verify Email Service Status**
   \`\`\`bash
   # Check API is running
   curl https://api.changeliberia.org/health

   # Check Redis connection
   redis-cli -u $REDIS_URL ping

   # Check database connectivity
   psql $DATABASE_URL -c "SELECT NOW();"
   \`\`\`

3. **Check Resend Service Status**
   - Visit https://status.resend.com
   - If status page shows outage → Wait for resolution
   - If green → Continue troubleshooting

### Investigation (5-15 min)

```bash
# 1. Check recent errors
redis-cli -u $REDIS_URL \
  LRANGE email-job-failed-jobs 0 -1

# 2. Review email logs
psql $DATABASE_URL -c "
  SELECT \"recipientEmail\", \"errorMessage\", \"sentAt\"
  FROM \"EmailLog\"
  WHERE status = 'FAILED'
  ORDER BY \"sentAt\" DESC
  LIMIT 20;"

# 3. Check API logs
docker logs --tail 100 api

# 4. Verify Resend API key is valid
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/emails \
  -X GET
```

### Common Issues & Fixes

**Issue: "Invalid API Key"**
- Fix: Update RESEND_API_KEY in .env.production
- Restart: \`docker restart api\`

**Issue: "Domain not verified"**
- Fix: Go to Resend dashboard, verify DNS records
- Wait: 5-30 minutes for DNS propagation

**Issue: Redis connection timeout**
- Fix: Check REDIS_URL format: redis://default:pass@host:port
- Verify: Network connectivity to Redis host

**Issue: Queue stuck with pending jobs**
- Fix: Restart email processor: \`docker restart api\`
- Reset: \`redis-cli FLUSHDB\` (⚠️ Deletes all data)

### Escalation

- **5 min:** Page on-call engineer
- **15 min:** Escalate to Tech Lead
- **30 min:** Escalate to CTO

### Post-Incident

- [ ] Root cause analysis
- [ ] Update monitoring
- [ ] Document lessons learned
```

### Runbook 3: Admin User Management

Create [docs/RUNBOOK_ADMIN_MANAGEMENT.md](docs/RUNBOOK_ADMIN_MANAGEMENT.md):

```markdown
# Admin User Management Runbook

## Adding New Admin User

### Via Database

\`\`\`bash
psql $DATABASE_URL << EOF
INSERT INTO "User" (
  id, "fullName", phone, email, role, 
  "trustScore", "verificationStatus", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Admin Name',
  '+231XXXXXXXXX',
  'admin@example.com',
  'ADMIN',
  70,
  'VERIFIED_LIBERIAN',
  NOW(),
  NOW()
);
EOF
\`\`\`

### Via API (If Admin Interface Ready)

\`\`\`bash
curl -X POST https://api.changeliberia.org/api/v1/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin Name",
    "email": "admin@example.com",
    "phone": "+231XXXXXXXXX",
    "role": "ADMIN",
    "tempPassword": "InitialPass123!"
  }'
\`\`\`

## Revoking Admin Access

\`\`\`bash
# Set role back to USER
psql $DATABASE_URL -c "
  UPDATE \"User\"
  SET role = 'USER'
  WHERE email = 'admin@example.com';
"
\`\`\`

## Resetting Admin Password

\`\`\`bash
# 1. Generate password reset token (admin can do this)
curl -X POST https://api.changeliberia.org/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'

# 2. Admin clicks email link to reset password
# 3. Or, directly update database (⚠️ for emergency only):
psql $DATABASE_URL -c "
  UPDATE \"User\"
  SET \"passwordHash\" = 'temp_placeholder'
  WHERE email = 'admin@example.com';
"
\`\`\`
```

### Runbook 4: Database Backup & Recovery

Create [docs/RUNBOOK_BACKUP_RECOVERY.md](docs/RUNBOOK_BACKUP_RECOVERY.md):

```markdown
# Database Backup & Recovery Runbook

## Automated Daily Backups

\`\`\`bash
#!/bin/bash
# scripts/backup-database-daily.sh

BACKUP_DIR="/backups/changeliberia"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump and compress database
pg_dump $DATABASE_URL | gzip > $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -mtime +30 -delete

echo "✓ Backup completed: $BACKUP_FILE"
\`\`\`

Add to crontab:
\`\`\`bash
# Daily at 2 AM
0 2 * * * bash /path/to/backup-database-daily.sh
\`\`\`

## Manual Backup

\`\`\`bash
# Full database dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Or compressed
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
\`\`\`

## Recovery from Backup

\`\`\`bash
# 1. Stop application
docker-compose down

# 2. Drop existing database (be careful!)
psql $DATABASE_URL -c "DROP DATABASE changeliberia;"

# 3. Create empty database
psql $DATABASE_URL -c "CREATE DATABASE changeliberia;"

# 4. Restore backup
psql $DATABASE_URL < backup_2026_05_27.sql

# 5. Restart application
docker-compose up -d

# 6. Verify recovery
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
\`\`\`
```

### Runbook 5: Performance Troubleshooting

Create [docs/RUNBOOK_PERFORMANCE.md](docs/RUNBOOK_PERFORMANCE.md):

```markdown
# Performance Troubleshooting Runbook

## Slow Email Delivery

**Symptoms:**
- Email delivery > 10 seconds
- Large email queue backlog
- API response time slow

**Investigation:**

\`\`\`bash
# 1. Check CPU and memory
docker stats api

# 2. Check database query performance
psql $DATABASE_URL -c "
  SELECT query, calls, mean_time 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;"

# 3. Check Redis memory
redis-cli -u $REDIS_URL INFO memory

# 4. Check email processor throughput
curl https://api.changeliberia.org/api/v1/email/queue-status \
  -H "Authorization: Bearer $ADMIN_TOKEN"
\`\`\`

**Solutions:**

- **Reduce concurrency:** Set `EMAIL_PROCESSOR_CONCURRENCY=3` (default 5)
- **Scale horizontally:** Add more email processor instances
- **Optimize database:** Add indexes on frequently queried fields
- **Upgrade resources:** Increase CPU/RAM allocation

## High API Response Time

\`\`\`bash
# 1. Check slow API routes
curl https://api.changeliberia.org/api/v1/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. Enable request logging
DEBUG=* npm run dev

# 3. Profile with clinic.js
npm install -g clinic
clinic doctor -- npm run dev
\`\`\`
```

### Final Documentation Structure

```
docs/
├── RUNBOOK_DAILY_OPERATIONS.md
├── RUNBOOK_INCIDENT_RESPONSE.md
├── RUNBOOK_ADMIN_MANAGEMENT.md
├── RUNBOOK_BACKUP_RECOVERY.md
├── RUNBOOK_PERFORMANCE.md
├── RUNBOOK_TROUBLESHOOTING.md (additional)
└── INDEX.md (links all runbooks)
```

---

## 🎯 Summary: Execution Checklist

- [ ] **Task 1 - Deploy to Production**
  - [ ] Validate production config
  - [ ] Deploy API (Railway or Docker)
  - [ ] Deploy Web (Vercel or Railway)
  - [ ] Run database migrations
  - [ ] Verify health endpoints

- [ ] **Task 2 - Create Admin User**
  - [ ] Run seed script or manual insert
  - [ ] Verify admin can login
  - [ ] Change default password
  - [ ] Add additional admins if needed

- [ ] **Task 3 - Send Test Email**
  - [ ] Verify Resend domain setup
  - [ ] Send test Welcome email
  - [ ] Verify email delivery in Resend dashboard
  - [ ] Test email preferences endpoint
  - [ ] Test queue status endpoint

- [ ] **Task 4 - Set Up Monitoring**
  - [ ] Create monitoring script
  - [ ] Add to cron (every 15 minutes)
  - [ ] Configure email alerts
  - [ ] Set up escalation procedures
  - [ ] Test alert system

- [ ] **Task 5 - Document Runbooks**
  - [ ] Create daily operations checklist
  - [ ] Create incident response procedures
  - [ ] Document admin management tasks
  - [ ] Document backup/recovery procedures
  - [ ] Document performance troubleshooting

---

## 📞 Support & Escalation

**For Production Issues:**
- **Email Issues:** Check [docs/RUNBOOK_INCIDENT_RESPONSE.md](docs/RUNBOOK_INCIDENT_RESPONSE.md)
- **Admin Questions:** Check [docs/RUNBOOK_ADMIN_MANAGEMENT.md](docs/RUNBOOK_ADMIN_MANAGEMENT.md)
- **Performance:** Check [docs/RUNBOOK_PERFORMANCE.md](docs/RUNBOOK_PERFORMANCE.md)

**Emergency Contacts:**
- Tech Lead: [contact]
- On-Call Engineer: [PagerDuty]
- CTO: [contact]

---

**Document Version:** 1.0
**Last Updated:** May 27, 2026
**Status:** ✅ Ready for Execution
