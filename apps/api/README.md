# API (NestJS)

## Modules
- auth
- users
- petitions
- signatures
- verification
- fraud
- admin

## Verification and Trust Score
- OTP +40
- Liberia IP +20
- Device +10
- ID +30
- Fraud event -50

Statuses:
- `UNVERIFIED`
- `VERIFIED_LIBERIAN`
- `VERIFIED_DIASPORA`
- `HIGH_TRUST`

## OpenAPI
- Swagger UI: `http://localhost:4000/api/v1/docs` (with default global prefix).

## Commands
- `pnpm dev`
- `pnpm build`
- `pnpm prisma:generate`
- `pnpm prisma:migrate`
- `pnpm prisma:seed`

## Fraud Phase 2 Endpoints
- `GET /api/v1/fraud/rules`
- `PATCH /api/v1/fraud/rules/:key`
- `GET /api/v1/fraud/analytics`
- `POST /api/v1/fraud/jobs/anomaly-scan`

## Phase 3 Automation
- Scheduler runs anomaly scans every 10 minutes.
- Signature risk evaluation now supports CAPTCHA orchestration for high-risk submissions.
- Discovery/trending petition APIs apply fraud-risk penalties before ranking.

## Docker
- Root context build: `docker build -f apps/api/Dockerfile .`
- Entrypoint runs `prisma migrate deploy` when `RUN_MIGRATIONS_ON_START=true`.
- Start command: `node dist/src/main.js` (Nest output layout).

## Phase 4 Operations
- `POST /api/v1/fraud/jobs/anomaly-scan` enqueues a scan job.
- `POST /api/v1/fraud/jobs/process-next` processes next queued fraud job.
- `GET /api/v1/fraud/metrics` returns queue depth, failed jobs, risk index, and alert level.
- `GET /metrics` Prometheus scrape target (root, not under `/api/v1`).
- `GET /health` liveness; `GET /health/ready` PostgreSQL readiness.
- Env: `CAPTCHA_PROVIDER` (`mock` | `turnstile` | `hcaptcha`), `TURNSTILE_SECRET_KEY`, `HCAPTCHA_SECRET_KEY`, `FRAUD_RISK_ALERT_THRESHOLD`.
