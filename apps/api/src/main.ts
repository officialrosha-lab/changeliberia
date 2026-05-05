import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Application } from 'express';
import { mkdirSync } from 'fs';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { validateEnvOrThrow } from './config/env-validation';
import { metricsRegister } from './metrics/prometheus.metrics';
import { PrismaService } from './prisma/prisma.service';
import { rawBodyMiddleware } from './common/middleware/raw-body.middleware';

function parseCorsOrigins(): boolean | string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) return true;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isSwaggerEnabled(): boolean {
  const prod = process.env.NODE_ENV === 'production';
  if (process.env.ENABLE_SWAGGER === 'true') return true;
  if (process.env.ENABLE_SWAGGER === 'false') return false;
  return !prod;
}

// Prevent unhandled Promise rejections (e.g. from Prisma's async engine
// initialisation) from crashing the process before app.listen() is reached.
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[bootstrap] Unhandled rejection (non-fatal):', reason);
});

async function ensureSchema(prisma: PrismaService) {
  const stmts = [
    // Petition columns from platform_v2_governance migration
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "categories" TEXT[]`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "county" TEXT`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "displayName" TEXT`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "priorActions" TEXT`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "tags" TEXT[]`,
    // Petition columns from add_petition_category and add_petition_type migrations
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "category" TEXT`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "petitionType" TEXT`,
    // Petition donation columns from cms_events_notifications_donations migration
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "donationsEnabled" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "donationGoal" DOUBLE PRECISION`,
    `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "totalDonations" DOUBLE PRECISION NOT NULL DEFAULT 0`,
    // UserRole enum + column (user_role_phase8) — JwtStrategy SELECTs role on every request
    // CREATE TYPE has no IF NOT EXISTS before PG16; catch{} handles duplicate_object silently
    `CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN')`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER'`,
    // AuthProvider enum + column (add_email_verification migration)
    `CREATE TYPE "AuthProvider" AS ENUM ('PHONE', 'EMAIL', 'GOOGLE')`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authProvider" "AuthProvider" NOT NULL DEFAULT 'PHONE'`,
    // User columns from platform_v2_governance migration
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "age" INTEGER`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "county" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" TEXT`,
    // User columns from cms_events_notifications_donations migration
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "badgesEarned" TEXT NOT NULL DEFAULT '[]'`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT`,
    // User columns from add_webhook_fields migration
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT`,
    // Membership table
    `CREATE TABLE IF NOT EXISTS "Membership" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'supporter',
      "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Membership_userId_key" ON "Membership"("userId")`,
    `CREATE INDEX IF NOT EXISTS "Membership_role_joinedAt_idx" ON "Membership"("role", "joinedAt")`,
    // PetitionStatusLog table — written on every petition.create()
    `CREATE TABLE IF NOT EXISTS "PetitionStatusLog" (
      "id" TEXT NOT NULL,
      "petitionId" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "note" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PetitionStatusLog_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE INDEX IF NOT EXISTS "PetitionStatusLog_petitionId_createdAt_idx" ON "PetitionStatusLog"("petitionId", "createdAt")`,
    // Supporter table
    `CREATE TABLE IF NOT EXISTS "Supporter" (
      "id" TEXT NOT NULL,
      "sessionId" TEXT NOT NULL,
      "userId" TEXT,
      "email" TEXT,
      "phone" TEXT,
      "source" TEXT NOT NULL DEFAULT 'navbar',
      "ipAddress" TEXT,
      "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Supporter_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Supporter_sessionId_key" ON "Supporter"("sessionId")`,
    `CREATE INDEX IF NOT EXISTS "Supporter_ipAddress_idx" ON "Supporter"("ipAddress")`,
    // AmbassadorApplication table
    `CREATE TABLE IF NOT EXISTS "AmbassadorApplication" (
      "id" TEXT NOT NULL,
      "fullName" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "location" TEXT NOT NULL,
      "occupation" TEXT,
      "motivation" TEXT NOT NULL,
      "growthPlan" TEXT NOT NULL,
      "socialLinks" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AmbassadorApplication_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "AmbassadorApplication_email_key" ON "AmbassadorApplication"("email")`,
    `CREATE INDEX IF NOT EXISTS "AmbassadorApplication_status_idx" ON "AmbassadorApplication"("status")`,
    `CREATE INDEX IF NOT EXISTS "AmbassadorApplication_createdAt_idx" ON "AmbassadorApplication"("createdAt")`,
    // Sponsor table
    `CREATE TABLE IF NOT EXISTS "Sponsor" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "logoUrl" TEXT NOT NULL,
      "websiteUrl" TEXT,
      "type" TEXT NOT NULL DEFAULT 'sponsor',
      "displayOrder" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
    )`,
  ];
  for (const sql of stmts) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch {
      // each statement is idempotent — ignore duplicate-object errors
    }
  }
  // FK constraints — added separately since they fail if already present
  const fks = [
    `ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "PetitionStatusLog" ADD CONSTRAINT "PetitionStatusLog_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  ];
  for (const sql of fks) {
    try { await prisma.$executeRawUnsafe(sql); } catch { /* already exists */ }
  }
}

async function bootstrap() {
  validateEnvOrThrow();
  const app = await NestFactory.create(AppModule);
  const enableSwagger = isSwaggerEnabled();
  
  // Register raw body middleware only for the Stripe webhook route
  // Applying it globally would consume the body stream before NestJS parses req.body
  app.use('/api/v1/payments/webhook', rawBodyMiddleware());
  
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: enableSwagger ? false : undefined,
    }),
  );
  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
  });
  const prisma = app.get(PrismaService);
  await ensureSchema(prisma);
  const httpServer = app.getHttpAdapter().getInstance() as Application;

  const uploadsRoot = join(process.cwd(), 'uploads');
  mkdirSync(join(uploadsRoot, 'id-documents'), { recursive: true });
  mkdirSync(join(uploadsRoot, 'petition-media'), { recursive: true });

  httpServer.get('/metrics', async (_req, res) => {
    res.set('Content-Type', metricsRegister.contentType);
    res.end(await metricsRegister.metrics());
  });

  httpServer.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  httpServer.get('/health/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not_ready' });
    }
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Change Liberia API')
      .setDescription(
        'REST API for petitions, verification, and fraud operations.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

void bootstrap();
