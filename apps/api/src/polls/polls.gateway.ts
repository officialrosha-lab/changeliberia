import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/polls', cors: true })
export class PollsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    client.emit('polls:connected', { socketId: client.id });
  }

  handleDisconnect(_client: Socket) {
    // Socket.IO handles cleanup on disconnect automatically.
  }

  @SubscribeMessage('subscribe_poll')
  handleSubscribePoll(client: Socket, payload: { pollId: string }) {
    if (payload?.pollId) {
      client.join(`poll:${payload.pollId}`);
      client.emit('polls:subscribed', { pollId: payload.pollId });
    }
    return { success: true, pollId: payload?.pollId };
  }

  @SubscribeMessage('unsubscribe_poll')
  handleUnsubscribePoll(client: Socket, payload: { pollId: string }) {
    if (payload?.pollId) {
      client.leave(`poll:${payload.pollId}`);
      client.emit('polls:unsubscribed', { pollId: payload.pollId });
    }
    return { success: true, pollId: payload?.pollId };
  }

  broadcastPollUpdate(pollId: string, payload: any) {
    // emit to a room for the poll
    this.server.to(`poll:${pollId}`).emit('pollUpdated', payload);
    // also broadcast summary to all connected clients
    this.server.emit('polls:update', { pollId, ...payload });
  }
}
