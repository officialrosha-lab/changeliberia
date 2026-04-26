import { Injectable, Inject } from '@nestjs/common';
import { PetitionsGateway } from './petitions.gateway';

/**
 * Service to trigger real-time broadcasts to connected WebSocket clients
 * Called when signatures are created or petitions are updated
 */
@Injectable()
export class PetitionsRealtimeService {
  constructor(
    @Inject(PetitionsGateway)
    private readonly petitionsGateway: PetitionsGateway,
  ) {}

  /**
   * Broadcast signature count update to all clients watching a petition
   */
  notifySignatureAdded(
    petitionId: string,
    signaturesCount: number,
    todaySignatures: number,
  ) {
    this.petitionsGateway.broadcastSignatureUpdate(
      petitionId,
      signaturesCount,
      todaySignatures,
    );
  }

  /**
   * Broadcast new signature event for pulse map and live feed
   */
  notifyNewSignatureWithLocation(data: {
    petitionId: string;
    timestamp?: string;
    signerName?: string;
    anonymous?: boolean;
  }) {
    this.petitionsGateway.broadcastNewSignature({
      petitionId: data.petitionId,
      timestamp: data.timestamp || new Date().toISOString(),
      signerName: data.signerName,
      anonymous: data.anonymous,
    });
  }
}
