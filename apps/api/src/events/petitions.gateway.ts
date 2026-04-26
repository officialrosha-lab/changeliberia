import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Real-time WebSocket gateway for petition updates
 * Broadcasts signature counts, new signatures, and map hotspot data
 */
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://10.158.217.47:3000',
      process.env.WEB_URL || 'http://localhost:3000',
    ],
    credentials: true,
  },
  namespace: 'petitions',
  transports: ['websocket', 'polling'],
})
export class PetitionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(PetitionsGateway.name);
  private connectedClients = new Map<string, { petitionId?: string }>();

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, {});
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  /**
   * Client subscribes to updates for a specific petition
   */
  @SubscribeMessage('subscribe_petition')
  async handleSubscribePetition(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { petitionId: string },
  ) {
    const { petitionId } = data;
    const client_info = this.connectedClients.get(client.id) || {};
    client_info.petitionId = petitionId;
    this.connectedClients.set(client.id, client_info);

    client.join(`petition:${petitionId}`);
    this.logger.log(`Client ${client.id} subscribed to petition ${petitionId}`);

    // Send current petition data
    try {
      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
        select: {
          id: true,
          title: true,
          signaturesCount: true,
          todaySignatures: true,
          category: true,
          imageUrl: true,
        },
      });
      if (petition) {
        client.emit('petition_update', {
          id: petition.id,
          title: petition.title,
          signaturesCount: petition.signaturesCount,
          todaySignatures: petition.todaySignatures || 0,
          category: petition.category,
          image: petition.imageUrl,
        });
      }
    } catch (error) {
      this.logger.error(`Error fetching petition ${petitionId}:`, error);
    }
  }

  /**
   * Broadcast signature count update to all connected clients for a petition
   */
  broadcastSignatureUpdate(
    petitionId: string,
    signaturesCount: number,
    todaySignatures: number,
  ) {
    this.server.to(`petition:${petitionId}`).emit('signature_update', {
      petitionId,
      signaturesCount,
      todaySignatures,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(
      `Broadcasted update for petition ${petitionId}: ${signaturesCount} total, ${todaySignatures} today`,
    );
  }

  /**
   * Broadcast new signature event with location data for pulse map
   */
  broadcastNewSignature(data: {
    petitionId: string;
    county?: string;
    latitude?: number;
    longitude?: number;
    timestamp: string;
    signerName?: string;
    anonymous?: boolean;
  }) {
    this.server.emit('new_signature', data);

    this.logger.debug(
      `Broadcasted new signature for petition ${data.petitionId} from ${data.county || 'unknown'}`,
    );
  }

  /**
   * Get all trending petitions with live counts
   */
  @SubscribeMessage('get_trending')
  async handleGetTrending(@ConnectedSocket() client: Socket) {
    try {
      const trending = await this.prisma.petition.findMany({
        where: { status: 'APPROVED' },
        orderBy: [{ todaySignatures: 'desc' }, { signaturesCount: 'desc' }],
        take: 10,
        select: {
          id: true,
          title: true,
          signaturesCount: true,
          todaySignatures: true,
          category: true,
        },
      });
      client.emit('trending_petitions', {
        petitions: trending,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error fetching trending petitions:', error);
      client.emit('error', { message: 'Failed to fetch trending petitions' });
    }
  }

  /**
   * Get pulse map data - petition hotspots with intensity
   */
  @SubscribeMessage('get_pulse_map')
  async handleGetPulseMap(@ConnectedSocket() client: Socket) {
    try {
      const hotspots = await this.getPulseMapData();
      client.emit('pulse_map_data', {
        hotspots,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error fetching pulse map data:', error);
      client.emit('error', { message: 'Failed to fetch map data' });
    }
  }

  /**
   * Helper: Generate pulse map hotspot data
   */
  private async getPulseMapData() {
    // Sample hotspots - in production, query from Prisma
    const counties = [
      { name: 'Montserrado', lat: 6.3183, lng: -10.8085, intensity: 0.8 },
      { name: 'Grand Cape Mount', lat: 6.6667, lng: -11.5, intensity: 0.6 },
      { name: 'Lofa', lat: 7.5833, lng: -10.0833, intensity: 0.5 },
      { name: 'Bong', lat: 6.6484, lng: -9.7367, intensity: 0.4 },
      { name: 'Grand Gedeh', lat: 4.7333, lng: -8.4667, intensity: 0.3 },
    ];

    return counties.map((county) => ({
      name: county.name,
      latitude: county.lat,
      longitude: county.lng,
      intensity: county.intensity,
      petitions: Math.floor(county.intensity * 50), // Mock petition count
    }));
  }
}
