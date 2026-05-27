# Railway Production Setup Guide

Complete your production environment configuration with Railway for database and Redis.

## Current Status

- ✅ Resend email service configured
- ✅ JWT secret generated
- ⏳ PostgreSQL database - needs connection string
- ⏳ Redis cache - needs to be created

## Part 1: Get PostgreSQL Connection String from Railway

### Step 1: Access Your Railway Project

1. Go to https://railway.app/dashboard
2. Select your project (or create new if needed)
3. Click on your PostgreSQL plugin/database

### Step 2: Find Connection String

1. In the PostgreSQL details, look for **"Connection"** tab
2. You'll see several connection options:
   - PostgreSQL Client
   - Connection Pool
   - Raw Connection String

3. Copy the **Raw Connection String** (looks like):
   ```
   postgresql://postgres:password@monorail.proxy.rlwy.net:35769/railway
   ```

### Step 3: Update .env.production

```bash
# Open .env.production and update:
DATABASE_URL="postgresql://postgres:password@monorail.proxy.rlwy.net:35769/railway"
```

Replace:
- `postgres` with your username (if different)
- `password` with your actual password
- `monorail.proxy.rlwy.net:35769` with your actual host and port
- `railway` with your actual database name

## Part 2: Create Redis in Railway

### Step 1: Add Redis to Your Project

1. In Railway dashboard, click **"+ New"** button
2. Search for **"Redis"**
3. Click **"Redis"** to add it to your project
4. Wait for it to deploy (1-2 minutes)

### Step 2: Get Redis Connection URL

1. Click on the newly created Redis plugin
2. Look for **"Connection"** tab or **"Redis URL"**
3. Copy the full URL (looks like):
   ```
   redis://default:password@host:6379
   ```

### Step 3: Update .env.production

```bash
# Open .env.production and update:
REDIS_URL="redis://default:password@host:6379"
```

Replace with your actual Redis URL from Railway.

## Part 3: Run Database Migrations

Once DATABASE_URL is set, initialize the production database:

### Option 1: Using Railway CLI

```bash
# Install Railway CLI if you haven't
npm install -g @railway/cli

# Login to Railway
railway login

# Run migrations on production database
DATABASE_URL="your-full-connection-string" npm run migrate:prod
```

### Option 2: Manual Migration

```bash
# In your project directory
cd /Users/visionalventure/Change\ Liberia

# Run migrations
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Seed initial data (if needed)
DATABASE_URL="postgresql://..." npx prisma db seed
```

## Part 4: Verify Configuration

### Test Database Connection

```bash
# Test with psql (if installed)
psql "postgresql://postgres:password@monorail.proxy.rlwy.net:35769/railway" \
  -c "SELECT version();"

# Or test with Node.js
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`
  .then(() => console.log('✅ Database connected'))
  .catch(e => console.log('❌ Connection failed:', e.message))
"
```

### Test Redis Connection

```bash
# Test with redis-cli (if installed)
redis-cli -u "redis://default:password@host:6379" ping

# Or test with Node.js
node -e "
const redis = require('redis');
const client = redis.createClient({ url: 'redis://default:password@host:6379' });
client.connect()
  .then(() => console.log('✅ Redis connected'))
  .catch(e => console.log('❌ Redis failed:', e.message))
"
```

## Part 5: Update .env.production - Complete Template

```bash
# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DATABASE_URL="postgresql://user:password@host:port/dbname"

# ============================================================================
# REDIS CONFIGURATION
# ============================================================================
REDIS_URL="redis://default:password@host:6379"

# ============================================================================
# EMAIL CONFIGURATION
# ============================================================================
RESEND_API_KEY="re_3puwiQi1_DPNqBm1WSYbVe6SCWBw9QuKS"
MAIL_FROM="noreply@changeliberia.org"
EMAIL_REPLY_TO="support@changeliberia.org"

# ============================================================================
# SECURITY
# ============================================================================
JWT_SECRET="ikhAQpkucj+uRwKrNUbWY4jIEy2TsRtGnJagu7jpkCA="
JWT_EXPIRES_IN="7d"

# ============================================================================
# DEPLOYMENT
# ============================================================================
NODE_ENV="production"
APP_URL="https://changeliberia.org"
CORS_ORIGIN="https://changeliberia.org"
```

## Part 6: Deploy to Production

Once all values are set:

```bash
# Build the application
npm run build

# Start production server
npm run start

# Or deploy to Railway
railway up
```

## Part 7: Monitor Production

### Check Railway Logs

```bash
# View real-time logs
railway logs

# View logs for specific service
railway logs -s api
railway logs -s web
```

### Monitor Email Delivery

1. Go to https://resend.com/emails
2. Check delivery status
3. View bounce/complaint rates

### Monitor Database & Redis

Railway dashboard shows:
- Connection count
- Query performance
- Memory usage (Redis)
- Disk usage (PostgreSQL)

## Troubleshooting

### Connection Refused

**Error:** `connect ECONNREFUSED`

- Verify DATABASE_URL/REDIS_URL is correct
- Check if database/Redis is running in Railway
- Verify firewall/network settings allow connections
- Try connecting from Railway CLI first: `railway shell`

### Invalid Credentials

**Error:** `password authentication failed`

- Double-check username and password in connection string
- Ensure no special characters need escaping (e.g., `@` → `%40`)
- Reset credentials in Railway dashboard if needed

### Timeout/Slow Queries

- Check network latency: `ping monorail.proxy.rlwy.net`
- Monitor active connections in Railway dashboard
- Optimize database queries if data is large

### Email Not Sending

- Verify RESEND_API_KEY is set and valid
- Check domain is verified in Resend dashboard
- View email logs at https://resend.com/emails
- Ensure MAIL_FROM matches verified domain

## Next Steps

1. ✅ Complete Tasks 1-3 checklist
2. Fill in DATABASE_URL and REDIS_URL from Railway
3. Test database migrations
4. Deploy to production
5. Verify email sending works end-to-end
6. Set up monitoring and alerts

---

**Reference:** [Railway Documentation](https://docs.railway.app)
