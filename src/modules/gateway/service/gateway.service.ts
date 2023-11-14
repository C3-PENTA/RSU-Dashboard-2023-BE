import { Server, Socket } from 'socket.io';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { CORS } from 'src/constants';

@WebSocketGateway({
  cors: CORS,
})
export class GatewayService
  implements OnGatewayInit, OnGatewayDisconnect, OnGatewayConnection
{

  @WebSocketServer()
  server: Server;

  public socketClients: Map<string, string>;

  constructor() {
    this.socketClients = new Map();
  }

  afterInit() {
    console.log('Gateway Server Init');
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.socketClients.forEach((socketId, nodeId) => {
      if (nodeId == client.handshake.headers.node_id) {
        this.socketClients.delete(nodeId);
      }
    });
    console.log('Connection List: ', this.socketClients);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.socketClients.set(String(client.handshake.headers.node_id), client.id);
    console.log('Connection', this.socketClients);
  }
}