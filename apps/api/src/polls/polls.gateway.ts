import { Injectable, Logger } from '@nestjs/common';
import { RealtimeService } from '../realtime/realtime.service';

/**
 * Broadcasts poll vote updates via Supabase Realtime (`poll:{id}` channel,
 * plus a global `polls:global` channel). Clients subscribe directly to
 * Supabase — see apps/web/lib/use-poll-socket.ts.
 * Previously a Socket.IO gateway; moved off in-process rooms since a
 * persistent server isn't available on Vercel serverless functions.
 */
@Injectable()
export class PollsGateway {
  private readonly logger = new Logger(PollsGateway.name);

  constructor(private readonly realtime: RealtimeService) {}

  async broadcastPollUpdate(pollId: string, payload: any) {
    await Promise.all([
      this.realtime.broadcast(`poll:${pollId}`, 'pollUpdated', payload),
      this.realtime.broadcast('polls:global', 'polls:update', { pollId, ...payload }),
    ]);
    this.logger.debug(`Broadcasted poll update for ${pollId}`);
  }
}
