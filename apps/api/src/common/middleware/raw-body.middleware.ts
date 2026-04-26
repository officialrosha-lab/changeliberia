import { Request } from 'express';

/**
 * Interface for requests with raw body access
 * Required for webhook signature verification (HMAC-SHA256)
 * Stripe webhooks must verify against the raw bytes, not parsed JSON
 */
export interface RawBodyRequest<T = any> extends Request {
  /**
   * The raw request body as Buffer
   * Must be populated by the rawBodyMiddleware before reaching the controller
   */
  rawBody?: Buffer;

  /**
   * The parsed body (required by Express Request)
   */
  body: T;
}

/**
 * Middleware to capture raw request body for webhook signature verification
 * Must be applied before JSON parsing middleware
 *
 * Usage in main.ts:
 * ```typescript
 * const app = await NestFactory.create(AppModule, {
 *   rawBody: true,
 * });
 *
 * // OR add middleware to specific routes:
 * app.use('/api/payments/webhook', rawBodyMiddleware());
 * ```
 */
export function rawBodyMiddleware() {
  return (req: RawBodyRequest, res: any, next: any) => {
    if (req.is('application/json')) {
      let rawBody = Buffer.alloc(0);

      req.on('data', (chunk: Buffer) => {
        rawBody = Buffer.concat([rawBody, chunk]);
      });

      req.on('end', () => {
        req.rawBody = rawBody;
        next();
      });
    } else {
      next();
    }
  };
}

/**
 * Alternative: Use Express raw body parser
 * Configuration for main.ts:
 * ```typescript
 * const app = await NestFactory.create(AppModule);
 * app.use(express.raw({ type: 'application/json' }));
 * app.useGlobalPipes(new ValidationPipe());
 * ```
 *
 * For NestJS, the preferred approach is using NestFactory.create with rawBody option:
 * ```typescript
 * const app = await NestFactory.create(AppModule, {
 *   rawBody: true,
 * });
 * ```
 */

/**
 * Alternative middleware if NestFactory rawBody option not available
 * Ensures rawBody is populated before JSON body parsing
 */
export async function enableRawBodyForWebhooks(app: any) {
  // Option 1: Configure at bootstrap time (preferred)
  // This is handled in main.ts during NestFactory.create()

  // Option 2: Apply middleware to specific routes
  // Can be done using app.use() before other middleware

  // Option 3: Use bodyParser with custom configuration
  // const bodyParser = require('body-parser');
  // app.use('/api/payments/webhook', bodyParser.raw({ type: 'application/json' }));
}
