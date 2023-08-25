import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nodes } from '../nodes/entity/nodes.entity';
import { EventsController } from './controller/events.controller';
import { EventsService } from './service/events.service';
import { CommunicationEvents } from './entity/communication-events.entity';
import { AvailabilityEvents } from './entity/availability-events.entity';
import { NodeService } from '../nodes/service/nodes.service';
import { IgnoreEventsService } from '../users/service/ignore-events.service';
import { IgnoreEvents } from '../users/entity/ignore-events.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Nodes, CommunicationEvents, AvailabilityEvents, IgnoreEvents]),
  ],
  controllers: [EventsController],
  providers: [EventsService, NodeService, IgnoreEventsService],
})
export class EventsModule {}
