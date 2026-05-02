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

async function ensureColumns(prisma: PrismaService) {
  const cols: Array<{ table: string; column: string; definition: string }> = [
    { table: 'Petition', column: 'categories',   definition: 'TEXT[]' },
    { table: 'Petition', column: 'county',        definition: 'TEXT' },
    { table: 'Petition', column: 'displayName',   definition: 'TEXT' },
    { table: 'Petition', column: 'isAnonymous',   definition: 'BOOLEAN NOT NULL DEFAULT false' },
    { table: 'Petition', column: 'priorActions',  definition: 'TEXT' },
    { table: 'Petition', column: 'tags',          definition: 'TEXT[]' },
    { table: 'User',     column: 'address',       definition: 'TEXT' },
    { table: 'User',     column: 'age',           definition: 'INTEGER' },
    { table: 'User',     column: 'county',        definition: 'TEXT' },
    { table: 'User',     column: 'gender',        definition: 'TEXT' },
  ];
  for (const { table, column, definition } of cols) {
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${definition}`,
      );
    } catch {
      // column likely already exists — safe to ignore
    }
  }
  for (const tbl of ['Membership', 'PetitionStatusLog']) {
    try {
      const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
        `SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = $1) AS exists`,
        tbl,
      );
      if (!rows[0]?.exists) {
        if (tbl === 'Membership') {
          await prisma.$executeRawUnsafe(`
            CREATE TABLE "Membership" (
              "id" TEXT NOT NULL,
              "userId" TEXT NOT NULL,
              "role" TEXT NOT NULL DEFAULT 'supporter',
              "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
            )`);
          await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Membership_userId_key" ON "Membership"("userId")`);
          await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Membership_role_joinedAt_idx" ON "Membership"("role", "joinedAt")`);
          await prisma.$executeRawUnsafe(`ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        } else {
          await prisma.$executeRawUnsafe(`
            CREATE TABLE "PetitionStatusLog" (
              "id" TEXT NOT NULL,
              "petitionId" TEXT NOT NULL,
              "status" TEXT NOT NULL,
              "note" TEXT,
              "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "PetitionStatusLog_pkey" PRIMARY KEY ("id")
            )`);
          await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PetitionStatusLog_petitionId_createdAt_idx" ON "PetitionStatusLog"("petitionId", "createdAt")`);
          await prisma.$executeRawUnsafe(`ALTER TABLE "PetitionStatusLog" ADD CONSTRAINT "PetitionStatusLog_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        }
      }
    } catch {
      // table likely already exists — safe to ignore
    }
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
  await ensureColumns(prisma);
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
