# Phase 12.1: Environment Configuration Setup

## Overview

Phase 12.1 configures all environment variables required for Stripe webhook integration and payment processing. This guide covers setup for development, staging, and production environments.

## Files Updated/Created

### 1. `.env.example` - Environment Template
**File**: `apps/api/.env.example`
- Comprehensive example of all environment variables
- Includes comments and setup instructions
- Safe to commit to version control

### 2. `env-validation.ts` - Environment Validation
**File**: `apps/api/src/config/env-validation.ts`
- Validates critical environment variables in production
- Checks for Stripe API key format (sk_live_* vs sk_test_*)
- Validates webhook signing secret format (whsec_*)
- Validates database URL and JWT secret

### 3. `stripe.config.ts` - Stripe Configuration
**File**: `apps/api/src/config/stripe.config.ts`
- Centralized Stripe configuration
- Feature flags for payment features
- Validation rules and retry policies
- API version and webhook settings

### 4. Updated Services
- **PaymentService** - Updated to use `STRIPE_API_KEY` instead of `STRIPE_SECRET_KEY`
- **PaymentController** - Updated to use `STRIPE_API_KEY` instead of `STRIPE_SECRET_KEY`
- **PaymentModule** - Registers Phase 12 webhook services

## Required Environment Variables

### Production (MUST HAVE)

```bash
# Core Application
NODE_ENV=production
PORT=4000
DATABASE_URL="postgresql://user:pass@host/db"
JWT_SECRET="your-strong-random-secret-key"

# Stripe (LIVE KEYS)
STRIPE_API_KEY="sk_live_..."              # Live secret key
STRIPE_PUBLISHABLE_KEY="pk_live_..."      # Live publishable key
STRIPE_WEBHOOK_SECRET="whsec_..."         # Webhook signing secret from Stripe Dashboard
```

### Development (RECOMMENDED)

```bash
# Core Application
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://user:pass@localhost:5432/change_liberia_dev"
JWT_SECRET="dev-secret-key"

# Stripe (TEST KEYS)
STRIPE_API_KEY="sk_test_..."              # Test secret key
STRIPE_PUBLISHABLE_KEY="pk_test_..."      # Test publishable key
STRIPE_WEBHOOK_SECRET="whsec_test_..."    # Test webhook signing secret
```

### Optional Settings

```bash
# Stripe Settings
STRIPE_CURRENCY="USD"                      # Default currency (default: USD)
WEBHOOK_SIGNATURE_TOLERANCE=300            # Timestamp tolerance in seconds (default: 5 min)
ENABLE_WEBHOOK_LOGGING=true               # Enable webhook debug logging (default: false)

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"       # Allowed origins (comma-separated)

# API Documentation
ENABLE_SWAGGER=true                        # Enable Swagger/OpenAPI docs

# Email Configuration
EMAIL_PROVIDER="sendgrid"
EMAIL_API_KEY="SG...."
EMAIL_FROM="noreply@changeliberia.org"

# Third-Party Integrations
FACEBOOK_APP_ID="..."
GOVERNMENT_API_URL="https://..."
```

## Setup Instructions

### Step 1: Copy Environment Template

```bash
cd apps/api
cp .env.example .env
```

### Step 2: Get Stripe Keys

#### Development Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign in (create account if needed)
3. Ensure you're in **Test Mode** (toggle in top-right)
4. Navigate to **Developers** → **API Keys**
5. Copy:
   - **Secret Key** → Set as `STRIPE_API_KEY=sk_test_...`
   - **Publishable Key** → Set as `STRIPE_PUBLISHABLE_KEY=pk_test_...`

#### Production Keys

1. In Stripe Dashboard, switch to **Live Mode**
2. Navigate to **Developers** → **API Keys**
3. Copy:
   - **Secret Key** → Set as `STRIPE_API_KEY=sk_live_...`
   - **Publishable Key** → Set as `STRIPE_PUBLISHABLE_KEY=pk_live_...`

### Step 3: Configure Webhook Signing Secret

#### For Local Development (Stripe CLI)

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe  # macOS
   ```

2. Login to Stripe account:
   ```bash
   stripe login
   ```

3. Start webhook listener:
   ```bash
   stripe listen --forward-to localhost:4000/api/v1/payments/webhook
   ```

4. Copy the webhook signing secret from output:
   ```
   Your webhook signing secret is: whsec_test_1234567890abcdefg
   ```

5. Add to `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET="whsec_test_1234567890abcdefg"
   ```

#### For Production (Stripe Dashboard)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **+ Add endpoint**
4. Enter webhook URL: `https://yourdomain.com/api/v1/payments/webhook`
5. Select events to listen for (all payment-related events recommended)
6. Click **Add endpoint**
7. Click the endpoint to view details
8. Copy **Signing secret** → Set as `STRIPE_WEBHOOK_SECRET=whsec_...`

### Step 4: Update Other Variables

```bash
# Edit .env with your settings
nano .env
```

Key variables to update:
- `DATABASE_URL` - Your database connection string
- `JWT_SECRET` - Random secure string for JWT tokens
- `CORS_ORIGIN` - Frontend URL(s) for CORS
- `EMAIL_PROVIDER` & `EMAIL_API_KEY` - Email service credentials

### Step 5: Validate Configuration

```bash
# Start application (development)
npm run dev

# The app will validate environment variables on startup
# Production mode requires additional validation (see below)
```

### Step 6: Test Webhook Integration (Development)

```bash
# In one terminal, start the app
npm run dev

# In another terminal, trigger test webhooks
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded

# Check application logs for successful processing
tail -f logs/payment.log
```

## Environment Variable Reference

### Application Variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| NODE_ENV | Yes | - | `development`, `test`, or `production` |
| PORT | No | 4000 | Server port |
| DATABASE_URL | Yes | - | PostgreSQL connection string |
| JWT_SECRET | Yes | - | Must be strong in production |

### Stripe Variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| STRIPE_API_KEY | Yes | - | Test: `sk_test_...` / Live: `sk_live_...` |
| STRIPE_PUBLISHABLE_KEY | No | - | For client-side integration |
| STRIPE_WEBHOOK_SECRET | Yes* | - | From Stripe Dashboard webhooks |
| STRIPE_CURRENCY | No | USD | ISO 4217 code |

*Required if webhooks are enabled

### Webhook Variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| WEBHOOK_SIGNATURE_TOLERANCE | No | 300 | Seconds (5 minutes) |
| ENABLE_WEBHOOK_LOGGING | No | false | Enable debug logging |

### API & CORS Variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| CORS_ORIGIN | No | true | Comma-separated URLs or `true` |
| ENABLE_SWAGGER | No | false* | Enable API documentation |

*Enabled in development, disabled in production by default

## Validation Rules

### Development Environment

✓ Accepts test Stripe keys (sk_test_...)
✓ Allows less secure JWT secrets
✓ No strict database validation
✓ Swagger docs enabled by default

### Production Environment (Strict Validation)

✗ REQUIRES live Stripe keys (sk_live_...)
✗ REQUIRES strong JWT_SECRET
✗ REQUIRES STRIPE_WEBHOOK_SECRET
✗ REQUIRES DATABASE_URL
✗ REJECTS weak configuration

### Application Startup

On application startup (`main.ts`), the `validateEnvOrThrow()` function runs:

```typescript
// In production, missing or invalid config throws error
if (process.env.NODE_ENV === 'production') {
  validateEnvOrThrow();
}
```

If validation fails, application exits with error message.

## Security Best Practices

### 1. Never Commit Secrets

```bash
# .gitignore already includes:
.env          # Don't commit actual environment file
.env.*.local   # Don't commit local overrides

# .env.example CAN be committed (no secrets)
git add .env.example
git commit -m "Add environment template"
```

### 2. Use Strong Secrets

Generate strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Result: `a7f3c8d9e2b1a4f6c8e9b2d3f4a6c8e9b1d3f5a7c9e1b3d5f7a9b1c3d5f7a9`

### 3. Secure Key Storage

**Development**: `.env` file (in .gitignore)
**Staging**: Environment variables from deployment platform
**Production**: Use secrets management:
- Docker Secrets
- Kubernetes Secrets
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault

### 4. Key Rotation

- Rotate Stripe keys periodically
- Re-generate JWT secrets if compromised
- Update webhook signing secrets if needed
- Document all key rotation events

### 5. Monitoring & Alerts

Set up alerts for:
- Failed webhook signature verification
- Invalid API key attempts
- Unusual payment amounts
- Rate limit warnings

## Troubleshooting

### Issue: "Production requires STRIPE_API_KEY"

**Cause**: `STRIPE_API_KEY` not set in environment
**Solution**: Add `STRIPE_API_KEY=sk_...` to environment

### Issue: "Production requires... to use live key (sk_live_*)"

**Cause**: Using test key (sk_test_) in production
**Solution**: 
1. Get live keys from Stripe Dashboard
2. Switch to Live Mode in Stripe Dashboard
3. Update `STRIPE_API_KEY` with sk_live_... key

### Issue: "Production requires STRIPE_WEBHOOK_SECRET"

**Cause**: Webhook signing secret not configured
**Solution**:
1. Configure webhook endpoint in Stripe Dashboard
2. Copy signing secret from webhook details page
3. Add to environment: `STRIPE_WEBHOOK_SECRET=whsec_...`

### Issue: Webhooks not working locally

**Cause**: Stripe CLI not running or webhook secret mismatch
**Solution**:
```bash
# 1. Start Stripe CLI listener
stripe listen --forward-to localhost:4000/api/v1/payments/webhook

# 2. Copy the signing secret
# 3. Add to .env: STRIPE_WEBHOOK_SECRET=whsec_test_...

# 4. Restart application
npm run dev

# 5. Test webhook
stripe trigger payment_intent.succeeded
```

### Issue: "Webhook timestamp outside tolerance"

**Cause**: Server time out of sync with Stripe servers
**Solution**:
```bash
# Sync system time with NTP server
ntpdate -s time.nist.gov  # macOS/Linux

# Or increase tolerance temporarily (development only)
WEBHOOK_SIGNATURE_TOLERANCE=600  # 10 minutes
```

## Environment Files Summary

### .env (Actual Secrets - Don't Commit)

```bash
NODE_ENV=development
STRIPE_API_KEY=sk_test_51Abc123DEfgh456ijkl...
STRIPE_WEBHOOK_SECRET=whsec_test_1234567890...
JWT_SECRET=a7f3c8d9e2b1a4f6c8e9b2d3f4a6c8e9...
DATABASE_URL=postgresql://user:password@localhost/db
```

### .env.example (Template - Can Commit)

```bash
# See .env.example file - safe to commit
```

### .env.production (Optional - Production Secrets)

```bash
# For deployment platforms that support .env files
# Usually unnecessary - use platform's secret management
```

## Deployment Guides

### Docker Deployment

```dockerfile
# Pass environment variables at runtime
docker run -e STRIPE_API_KEY=sk_live_... \
           -e STRIPE_WEBHOOK_SECRET=whsec_... \
           -e DATABASE_URL=postgresql://... \
           -e JWT_SECRET=... \
           change-liberia-api:latest
```

### Kubernetes Deployment

```yaml
# Use Kubernetes Secrets
apiVersion: v1
kind: Secret
metadata:
  name: stripe-secrets
type: Opaque
stringData:
  stripe-api-key: sk_live_...
  stripe-webhook-secret: whsec_...
  jwt-secret: ...
  database-url: postgresql://...
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  template:
    spec:
      containers:
      - name: api
        env:
        - name: STRIPE_API_KEY
          valueFrom:
            secretKeyRef:
              name: stripe-secrets
              key: stripe-api-key
```

### Environment-Specific Templates

#### Development (.env.development)
```bash
NODE_ENV=development
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
DEBUG=true
```

#### Staging (.env.staging)
```bash
NODE_ENV=production
STRIPE_API_KEY=sk_live_[STAGING_KEY]
STRIPE_WEBHOOK_SECRET=whsec_[STAGING_SECRET]
DEBUG=false
```

#### Production (.env.production)
```bash
NODE_ENV=production
STRIPE_API_KEY=sk_live_[LIVE_KEY]
STRIPE_WEBHOOK_SECRET=whsec_[LIVE_SECRET]
DEBUG=false
```

## Next Steps

After configuring environment variables:

1. **Verify Configuration**
   ```bash
   npm run dev
   # Check for validation errors
   ```

2. **Test Payment Flow**
   ```bash
   # Use Stripe test card: 4242 4242 4242 4242
   curl http://localhost:4000/api/v1/payments/intent \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"amount": 5000, "currency": "USD"}'
   ```

3. **Test Webhook Locally**
   ```bash
   stripe trigger payment_intent.succeeded
   ```

4. **Review Phase 12.2** - Setup Stripe webhooks (database schema, service wiring)

## Related Documentation

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Stripe Test Data](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Phase 12 Quick Reference](./PHASE_12_QUICK_REFERENCE.md)
- [Phase 12 Webhook Setup](./STRIPE_WEBHOOK_SETUP.md)
