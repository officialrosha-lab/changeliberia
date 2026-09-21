import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Application } from 'express';
import * as express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { metricsRegister } from './metrics/prometheus.metrics';
import { PrismaService } from './prisma/prisma.service';
import { rawBodyMiddleware } from './common/middleware/raw-body.middleware';
import { ensureSchema, seedCmsPages } from './bootstrap-tasks';

function parseCorsOrigins(): boolean | string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CORS_ORIGIN environment variable is required in production');
    }
    return ['http://localhost:3000'];
  }
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

/**
 * Builds and configures the Nest app, without binding it to a port — shared
 * by main.ts (Docker/local, calls app.listen()) and api/index.ts (Vercel
 * serverless function, wraps the Express instance with serverless-http).
 */
export async function createApp(): Promise<INestApplication> {
  // Disable the built-in 100 KB body-parser so we can configure our own limit.
  // Webhook routes get rawBodyMiddleware (registered first); everything else gets JSON up to 10 MB.
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const enableSwagger = isSwaggerEnabled();

  // Webhook routes need raw buffer for signature verification — register before JSON parser.
  app.use('/api/v1/payments/webhook', rawBodyMiddleware());
  app.use('/api/v1/webhooks/resend', rawBodyMiddleware());

  // JSON body parser with generous limit to accommodate base64 poll option images (up to 6 × ~150 KB).
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
  await seedCmsPages(prisma);
  const httpServer = app.getHttpAdapter().getInstance() as Application;

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
      .setDescription('REST API for petitions, verification, and fraud operations.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  return app;
}
