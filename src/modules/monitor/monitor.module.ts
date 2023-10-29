import { Module } from '@nestjs/common';
import { MonitorService } from './service/monitor.service';
import { MonitorController } from './controller/monitor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nodes } from '../nodes/entity/nodes.entity';
import { AvailabilityEvents } from '../events/entity/availability-events.entity';
import { NodeService } from '../nodes/service/nodes.service';
import { CommunicationEvents } from '../events/entity/communication-events.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Nodes, AvailabilityEvents, CommunicationEvents ])],
  providers: [MonitorService, NodeService],
  controllers: [MonitorController],
  exports: [MonitorService],
})
export class MonitorModule {}