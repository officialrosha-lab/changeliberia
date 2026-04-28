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
  const httpServer = app.getHttpAdapter().getInstance() as Application;

  const uploadsRoot = join(process.cwd(), 'uploads');
  mkdirSync(join(uploadsRoot, 'id-documents'), { recursive: true });

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
