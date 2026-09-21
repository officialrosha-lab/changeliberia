import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

/**
 * Server -> client push via Supabase Realtime Broadcast, replacing the
 * Socket.IO gateways this app used on Railway (a persistent process isn't
 * available on Vercel serverless functions). Broadcasting doesn't require a
 * subscribed connection — `channel.send()` works as a one-shot REST-backed
 * call, so this is safe to use from any request handler.
 *
 * These channels are public (unauthenticated) broadcasts, same trust model
 * as the Socket.IO rooms they replace — only broadcast data that's already
 * safe for anyone who knows the channel name to receive.
 */
@Injectable()
export class RealtimeService implements OnModuleInit {
  private readonly logger = new Logger(RealtimeService.name);
  private client!: ReturnType<typeof createClient>;

  onModuleInit() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async broadcast(channel: string, event: string, payload: unknown): Promise<void> {
    try {
      const result = await this.client.channel(channel).send({
        type: 'broadcast',
        event,
        payload,
      });
      if (result !== 'ok') {
        this.logger.warn(`Broadcast to ${channel}/${event} returned: ${result}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Broadcast to ${channel}/${event} failed: ${message}`);
    }
  }
}
