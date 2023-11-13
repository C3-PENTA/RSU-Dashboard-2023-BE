import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nodes } from '../nodes/entity/nodes.entity';
import { EventsController } from './controller/events.controller';
import { EventsService } from './service/events.service';
import { CommunicationEvents } from './entity/communication-events.entity';
import { AvailabilityEvents } from './entity/availability-events.entity';
import { IgnoreEvents } from '../users/entity/ignore-events.entity';
import { NodeModule } from '../nodes/node.module';
import { UsersModule } from '../users/users.module';
import { GatewayService } from '../gateway/service/gateway.service';
import { GatewayModule } from '../gateway/gateway.module';
import { DoorStatus } from './entity/door-status.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Nodes,
      CommunicationEvents,
      AvailabilityEvents,
      DoorStatus,
      IgnoreEvents,
    ]),
    NodeModule,
    UsersModule,
    GatewayModule
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService]
})
export class EventsModule {}
