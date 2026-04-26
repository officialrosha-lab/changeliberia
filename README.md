# Verified Liberian Voices

Production-grade Liberia-focused petition platform with verification, trust scoring, and conversion-first UX.

## Stack
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, Zustand
- Backend: NestJS, TypeScript, REST API
- Database: PostgreSQL + Prisma
- Auth: JWT + OTP abstraction

## Monorepo
- `apps/web` - conversion-optimized web app
- `apps/api` - REST API with trust, fraud, and admin modules
- `packages/ui` - shared UI primitives
- `packages/types` - shared types
- `packages/config` - shared config package

## Quick Start
1. Copy environment variables:
   - `cp .env.example .env`
2. Install dependencies:
   - `pnpm install`
3. Generate Prisma client:
   - `pnpm --filter api prisma:generate`
4. Run migrations (requires running PostgreSQL):
   - `pnpm --filter api prisma:migrate --name init`
5. Seed sample Liberia-oriented data:
   - `pnpm seed`
6. Start apps:
   - `pnpm dev`

## Core Product Loop
DISCOVER -> EMOTIONAL TRIGGER -> SIGN -> SHARE -> VIRAL GROWTH

Implemented with:
- Landing discovery and trending sections
- Sticky petition signature box + social proof
- Post-sign WhatsApp/Facebook/copy-link share modal
- Trust score and verification status updates

## Key API Paths
- `/api/v1/auth/*`
- `/api/v1/petitions/*`
- `/api/v1/signatures`
- `/api/v1/verification/*`
- `/api/v1/admin/*`
- `/api/v1/fraud/rules`
- `/api/v1/fraud/analytics`
- `/api/v1/fraud/jobs/anomaly-scan`
- `/api/v1/petitions/:id/updates`
- `/api/v1/petitions/:id/comments`
- `/api/v1/petitions/:id/approve` / `/api/v1/petitions/:id/reject` (admin, JWT)
- `/api/v1/verification/id-document` (submit ID for review; legacy `/verification/id` remains for dev)
- `/api/v1/verification/id-documents/:id/file` (JWT: owner or admin — stream or redirect)
- `/api/v1/admin/id-documents/*` (pending queue + status updates)
- `/api/v1/users/me/petitions`
- `/api/v1/docs` (Swagger UI)

## Phase 2 Hardening
- Configurable fraud rules (threshold, penalty, enabled state)
- Fraud event telemetry and top-triggered rule analysis
- Anomaly scan job producing historical risk snapshots
- Admin dashboard controls for rule tuning and manual anomaly scans

## Phase 3 Hardening
- Automated anomaly scans every 10 minutes via scheduler
- CAPTCHA orchestration in signature flow for high-risk events
- Risk-weighted petition discovery ranking to reduce fraud amplification

## Phase 4 Production Hardening
- **CAPTCHA:** `mock`, Cloudflare **Turnstile**, or **hCaptcha** (`CAPTCHA_PROVIDER`, secrets in `.env`)
- **Web:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` for real Turnstile widget on high-risk signatures (falls back to mock token flow when unset)
- **Fraud jobs:** Postgres-backed `FraudJob` queue + cron enqueue + per-minute worker (`FraudScheduler`)
- **Prometheus:** scrape `GET /metrics` (root path, **not** under `/api/v1`) — `vlv_fraud_risk_index`, `vlv_fraud_queue_depth`, `vlv_captcha_verifications_total`, etc.
- **Health:** `GET /health` (liveness), `GET /health/ready` (DB readiness)
- **Drift alerts:** when `riskIndex` exceeds `FRAUD_RISK_ALERT_THRESHOLD`, `vlv_fraud_anomaly_alerts_total` increments
- **JSON ops dashboard:** `GET /api/v1/fraud/metrics` (aggregate view for admin UIs)

## Phase 6 Engagement & API docs
- **Petition updates:** creator-only `POST /api/v1/petitions/:id/updates` (JWT); public `GET /api/v1/petitions/:id/updates` for approved petitions.
- **Comments:** public `GET /api/v1/petitions/:id/comments` and `POST /api/v1/petitions/:id/comments` (optional JWT; stricter rate limit). Petition page loads updates + comments and supports posting comments.
- **OpenAPI / Swagger UI:** `GET http://localhost:4000/api/v1/docs` (after global prefix).

## Phase 7 Identity review & creator dashboard
- **ID submission (workflow):** Authenticated users submit government ID via `POST /api/v1/verification/id-document`; each submission creates an `IDDocument` in **`PENDING`** until an admin reviews it. **Transport and on-disk storage** (multipart file vs. JSON `fileUrl`, local `uploads/`, and public URL prefix) are defined in **Phase 8** below.
- **Admin queue:** `GET /api/v1/admin/id-documents/pending` and `PATCH /api/v1/admin/id-documents/:id` to approve/reject; on first approval, `ID_UPLOAD` trust event (+30) is applied once per user.
- **Creator dashboard:** `GET /api/v1/users/me/petitions` powers `/dashboard`; web auth uses Zustand `persist` for session continuity.
- **Admin UI:** pending ID documents panel alongside existing fraud/admin tools.

## Phase 8 Production access & ID storage
- **Petition moderation:** Admins can **approve** or **reject** pending petitions from the web admin panel (`PATCH /petitions/:id/approve` / `reject`).
- **Admin RBAC:** `User.role` is `USER` or `ADMIN` (JWT is validated against the database on each request). All `/api/v1/admin/*` routes, all `/api/v1/fraud/*` routes, and `PATCH /api/v1/petitions/:id/approve` / `reject` require `ADMIN`.
- **Seeded admin:** After `pnpm seed`, user `+231770000001` has `ADMIN` (sign in via your auth flow, then open `/admin` in the web app). **In production,** assign `ADMIN` in the database (or a one-off script); do not rely on seed data for real moderators.
- **ID uploads (technical):** `POST /api/v1/verification/id-document` accepts **`multipart/form-data`** (`type` + `file`, JPEG/PNG/PDF up to 5 MB) **or** JSON `{ type, fileUrl }` for an already-hosted URL. Uploaded files are written under `uploads/id-documents/`. **`GET /api/v1/verification/id-documents/:id/file`** (JWT) streams the file to the **document owner** or an **admin**; external `fileUrl` values redirect only to `http:`/`https:` targets. There is **no** anonymous public `/uploads` static route. Set **`ID_DOCUMENT_PUBLIC_BASE_URL`** so stored metadata URLs stay consistent with your API origin. For stronger privacy and scale, plan **private object storage** (S3-compatible) and short-lived URLs—this repo defaults to local disk + optional remote `fileUrl`.
- **Swagger & CSP:** In production (`NODE_ENV=production`), OpenAPI UI is **off** unless `ENABLE_SWAGGER=true`. When Swagger is off, Helmet’s default **Content-Security-Policy** is enabled; when Swagger is on, CSP is relaxed for the docs UI.
- **Docker:** Compose mounts `api_uploads` at `/app/apps/api/uploads` so ID files survive container restarts.

## Production checklist
- **Secrets:** Rotate **`JWT_SECRET`**, database credentials, and CAPTCHA/Twilio keys; never commit real `.env` files.
- **HTTP / browser config:** Set **`CORS_ORIGIN`** to your real web origins (comma-separated). Set web **`NEXT_PUBLIC_API_URL`** and server **`API_URL_INTERNAL`** (Docker/K8s service URL) to the deployed API. Terminate TLS at your reverse proxy or load balancer.
- **API hardening:** Keep **`ENABLE_SWAGGER=false`** in production unless operators need in-browser docs; prefer network restriction if you enable it. Use real **`CAPTCHA_PROVIDER`** (Turnstile or hCaptcha) with valid keys.
- **Identity documents:** Set **`ID_DOCUMENT_PUBLIC_BASE_URL`** to the public API URL; use a persistent volume for **`uploads/`**. Files are served only via **`GET /api/v1/verification/id-documents/:id/file`** (owner or admin). Plan object storage + access policies for serious deployments.
- **Admins:** Ensure only trusted users have **`User.role = ADMIN`**; audit via database.
- **Data:** Configure **Postgres backups**, monitoring on **`/health`**, **`/health/ready`**, and **`/metrics`** as appropriate for your environment.

## Development workflow
- **Install & run:** `pnpm install`, `pnpm dev` (API + web via Turbo). Ensure Postgres is up and migrations are applied (`pnpm --filter api prisma migrate deploy`).
- **Quality gates:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (API smoke e2e, no DB), `pnpm build`.
- **Seed:** `pnpm seed` for sample data and a seeded **admin** phone (`+231770000001`).

## Phase 5 Deployment & CI
- **Docker Compose:** `pnpm docker:up` — Postgres, API (migrations on start when `RUN_MIGRATIONS_ON_START=true`), and web (Next standalone).
- **Images:** `apps/api/Dockerfile`, `apps/web/Dockerfile`; build context is the repo root.
- **Server-side API URL in Docker:** set `API_URL_INTERNAL` on the web service (e.g. `http://api:4000/api/v1`) so RSC/SSR can reach the API; browsers still use `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000/api/v1`).
- **CI:** GitHub Actions `.github/workflows/ci.yml` runs install, typecheck, lint, and build on push/PR to `main`/`master`.
- **API security:** Helmet + `CORS_ORIGIN` (comma-separated origins, or omit for permissive dev).
