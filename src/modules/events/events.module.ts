import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nodes } from '../nodes/entity/nodes.entity';
import { EventsController } from './controller/events.controller';
import { EventsService } from './service/events.service';
import { CommunicationEvents } from './entity/communication-events.entity';
import { AvailabilityEvents } from './entity/availability-events.entity';
import { IgnoreEvents } from '../users/entity/ignore-events.entity';
import { GatewayService } from './service/gateway.service';
import { NodeModule } from '../nodes/node.module';
import { UsersModule } from '../users/users.module';
import { MonitorModule } from '../monitor/monitor.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Nodes,
      CommunicationEvents,
      AvailabilityEvents,
      IgnoreEvents,
    ]),
    NodeModule,
    UsersModule,
    MonitorModule
  ],
  controllers: [EventsController],
  providers: [EventsService, GatewayService],
})
export class EventsModule {}
