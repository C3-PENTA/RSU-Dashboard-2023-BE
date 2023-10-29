import { Server, Socket } from 'socket.io';
import {
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { EventsService } from 'src/modules/events/service/events.service';
import { MonitorService } from 'src/modules/monitor/service/monitor.service';
import { EdgeSystemConnection } from 'src/constants';
import { Inject, Injectable, forwardRef } from '@nestjs/common';

@WebSocketGateway()
export class GatewayService
  implements OnGatewayInit, OnGatewayDisconnect
{

  @WebSocketServer()
  server: Server;

  public socketClients: Map<string, string>;

  constructor(
    @Inject(forwardRef(() => EventsService))
    private eventService: EventsService,
    @Inject(forwardRef(() => MonitorService))
    private monitorService: MonitorService
  ) {
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

  @SubscribeMessage('edge-status')
  async handleEdgeStatus(client: any, data: any) {
    console.log("Received data", data);
    const event = await this.eventService.parseDataToAvaiEvent(data);
    console.log("Availability Event: ", event);
    await this.eventService.saveEvent(1, event);
  }

  @SubscribeMessage('edge-message')
  async handleEdgeMessage(client: any, data: any) {
    console.log("Received data: ", data);
    const events = await this.eventService.parseDataToCommEvent(data);
    console.log("Communication Event: ", events);
    await this.eventService.saveEvent(2, events);
  }

  @SubscribeMessage('keep-alive')
  async handleKeepAlive(client: any, data: any) {
    console.log("Received data", data);
    if (data.timeStamp) {
      this.monitorService.setStatusKeepAlive(EdgeSystemConnection.Connected);
      this.monitorService.setCountDisconnect(0);
    }
  }
}