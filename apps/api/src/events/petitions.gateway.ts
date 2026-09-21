import { Injectable, Logger } from '@nestjs/common';
import { RealtimeService } from '../realtime/realtime.service';

/**
 * Broadcasts petition signature updates via Supabase Realtime. Clients
 * subscribe directly to Supabase channels (`petition:{id}` and the global
 * `petitions:global` channel) — see apps/web/lib/useWebSocket.ts.
 * Previously a Socket.IO gateway; moved off in-process rooms since a
 * persistent server isn't available on Vercel serverless functions.
 */
@Injectable()
export class PetitionsGateway {
  private readonly logger = new Logger(PetitionsGateway.name);

  constructor(private readonly realtime: RealtimeService) {}

  /** Broadcast signature count update to clients watching a specific petition. */
  async broadcastSignatureUpdate(
    petitionId: string,
    signaturesCount: number,
    todaySignatures: number,
  ) {
    await this.realtime.broadcast(`petition:${petitionId}`, 'signature_update', {
      petitionId,
      signaturesCount,
      todaySignatures,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(
      `Broadcasted update for petition ${petitionId}: ${signaturesCount} total, ${todaySignatures} today`,
    );
  }

  /** Broadcast a new-signature event (with location) to all clients, for the pulse map. */
  async broadcastNewSignature(data: {
    petitionId: string;
    county?: string;
    latitude?: number;
    longitude?: number;
    timestamp: string;
    signerName?: string;
    anonymous?: boolean;
  }) {
    await this.realtime.broadcast('petitions:global', 'new_signature', data);
    this.logger.debug(
      `Broadcasted new signature for petition ${data.petitionId} from ${data.county || 'unknown'}`,
    );
  }
}
