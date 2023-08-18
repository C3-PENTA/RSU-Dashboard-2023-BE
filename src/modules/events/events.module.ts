import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nodes } from '../nodes/entity/nodes.entity';
import { EventsController } from './controller/events.controller';
import { EventsService } from './service/events.service';
import { CommunicationEvents } from './entity/communication-events.entity';
import { AvailabilityEvents } from './entity/availability-events.entity';
import { NodeService } from '../nodes/service/nodes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Nodes, CommunicationEvents, AvailabilityEvents]),
  ],
  controllers: [EventsController],
  providers: [EventsService, NodeService],
})
export class EventsModule {}
