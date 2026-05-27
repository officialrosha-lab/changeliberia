# CRITICAL: API Backend Deployment Issue & Fix

## Problem Summary
Both frontends (changeliberia.org and changeliberia-web.vercel.app) cannot reach the API backend:
- **changeliberia.org**: Returns JSON parsing error (HTML instead of JSON)
- **changeliberia-web.vercel.app**: Returns "Unable to reach the server"

## Root Cause
The deployment architecture is incomplete:
1. ❌ API backend (NestJS) is NOT accessible at `https://changeliberia.org/api/v1`
2. ❌ changeliberia.org serves ONLY the Next.js frontend, no API routes
3. ❌ Vercel frontend attempts to reach the API but it's not reachable

## Solution: Deploy API Backend on Railway

### Step 1: Create Separate Railway Service for API

1. Go to: https://railway.app/dashboard
2. Create a NEW service in the Change Liberia project
3. Configure it to deploy from GitHub with railway.json
4. Set environment variables (see below)
5. Get the deployed API URL (e.g., `https://api-service-xyz.railway.app`)

### Step 2: Environment Variables for API Service

Set these on the API Railway service:
```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:TmYbbaDnOKeKQMHENYiHwXQAdybmVcSJ@monorail.proxy.rlwy.net:35769/railway
REDIS_URL=redis://default:nrAEBUqvMsoIzkSXhyJdwNywjENRnPie@zephyr.proxy.rlwy.net:16708
RESEND_API_KEY=re_3puwiQi1_DPNqBm1WSYbVe6SCWBw9QuKS
MAIL_FROM=noreply@changeliberia.org
JWT_SECRET=ikhAQpkucj+uRwKrNUbWY4jIEy2TsRtGnJagu7jpkCA=
CORS_ORIGIN=https://changeliberia.org,https://changeliberia-web.vercel.app,http://localhost:3000
PORT=4000
```

### Step 3: Update Frontend Configurations

#### Railway Frontend (changeliberia.org)
Set this Railway environment variable:
```
NEXT_PUBLIC_API_URL=https://api-service-xyz.railway.app/api/v1
```

#### Vercel Frontend (changeliberia-web.vercel.app)
1. Go to: https://vercel.com/dashboard → changeliberia-web → Settings → Environment Variables
2. Add/Update:
   ```
   NEXT_PUBLIC_API_URL=https://api-service-xyz.railway.app/api/v1
   ```
3. Redeploy

### Step 4: Verify Connectivity

Test from terminal:
```bash
# Replace with actual API URL
curl -s https://api-service-xyz.railway.app/api/v1/health | head -20

# Expected response:
{"status":"ok","uptime":12345}
```

## Alternative: Monolithic Deployment

If separate services are problematic, deploy as ONE service:

1. Create a single Dockerfile that builds both API and frontend
2. Run API on :4000
3. Run Next.js on :3000  
4. Use a reverse proxy (nginx) to route:
   - `/api/v1/*` → localhost:4000
   - `/*` → localhost:3000

### Single Service Dockerfile Template

```dockerfile
# Stage 1: Build API + Frontend
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=api --filter=web

# Stage 2: Runtime
FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/node_modules ./node_modules

# Install nginx for reverse proxy
RUN apk add --no-cache nginx

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Expose both ports
EXPOSE 80 4000 3000

# Start both services
CMD ["sh", "-c", "node apps/api/dist/src/main.js & node apps/web/server.js"]
```

## Implementation Checklist

- [ ] API service deployed on Railway with correct environment variables
- [ ] API service URL documented (e.g., https://api-xyz.railway.app)
- [ ] Railway frontend updated with NEXT_PUBLIC_API_URL
- [ ] Vercel frontend updated with NEXT_PUBLIC_API_URL  
- [ ] Both frontends redeployed
- [ ] API health endpoint tested: `/health` returns 200 OK
- [ ] Frontend login page tested: No "Unable to reach server" error
- [ ] Email system tested: Can still send/receive emails
- [ ] Database query tested: petitions showing on frontend

## Quick Test

### From changeliberia.org:
1. Navigate to https://changeliberia.org/auth/login
2. Try to login
3. Should show normal login form, not JSON parsing error

### From changeliberia-web.vercel.app:
1. Navigate to https://changeliberia-web.vercel.app/auth/login
2. Try to login
3. Should show normal login form, not connection error

## Recent Changes Made

✅ Added API proxy middleware in `apps/web/middleware.ts`
✅ Added API rewrites in `apps/web/next.config.ts`
✅ Added `.env.production` template

These changes allow the frontend to proxy requests through itself if needed, but the PRIMARY solution is still to deploy the backend API separately.

---

**Status**: 🔴 **CRITICAL** - Deployment incomplete, API backend not accessible
**Priority**: 🔴 HIGH - Users cannot login without this fix
**ETA**: 30-45 minutes to complete

Contact Railway support if you need help with multi-service deployment.
