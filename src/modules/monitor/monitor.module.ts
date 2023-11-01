import { Module } from '@nestjs/common';
import { MonitorService } from './service/monitor.service';
import { MonitorController } from './controller/monitor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nodes } from '../nodes/entity/nodes.entity';
import { AvailabilityEvents } from '../events/entity/availability-events.entity';
import { NodeService } from '../nodes/service/nodes.service';
import { CommunicationEvents } from '../events/entity/communication-events.entity';
import { EventsModule } from '../events/events.module';
import { NodeModule } from '../nodes/node.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Nodes, AvailabilityEvents, CommunicationEvents]),
    EventsModule,
    NodeModule,
    GatewayModule
  ],
  providers: [MonitorService],
  controllers: [MonitorController],
  exports: [MonitorService],
})
export class MonitorModule {}
