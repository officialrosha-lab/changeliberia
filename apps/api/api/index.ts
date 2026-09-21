import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'http';
import serverlessHttp from 'serverless-http';
import type { Application } from 'express';
import { createApp } from '../src/bootstrap';
import { validateEnvOrThrow } from '../src/config/env-validation';

/**
 * Vercel serverless entrypoint for the NestJS API. Vercel keeps warm function
 * instances alive across requests, so the Nest app is built once per
 * instance (including the schema patch-up and CMS seed in createApp()) and
 * cached here — not rebuilt on every invocation.
 *
 * See vercel.json: every path is rewritten to this function.
 */
type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

let handlerPromise: Promise<Handler> | undefined;

function getHandler(): Promise<Handler> {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      validateEnvOrThrow();
      const app = await createApp();
      await app.init();
      return serverlessHttp(app.getHttpAdapter().getInstance() as Application) as unknown as Handler;
    })().catch((error) => {
      // Don't cache a rejected promise — let the next invocation retry bootstrap.
      handlerPromise = undefined;
      throw error;
    });
  }
  return handlerPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const h = await getHandler();
  return h(req, res);
}
