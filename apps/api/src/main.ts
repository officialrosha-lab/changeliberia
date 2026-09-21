import { createApp } from './bootstrap';
import { validateEnvOrThrow } from './config/env-validation';

// Prevent unhandled Promise rejections (e.g. from Prisma's async engine
// initialisation) from crashing the process before app.listen() is reached.
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[bootstrap] Unhandled rejection (non-fatal):', reason);
});

async function bootstrap() {
  validateEnvOrThrow();
  const app = await createApp();
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

void bootstrap();
