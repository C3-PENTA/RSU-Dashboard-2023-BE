import { Module } from '@nestjs/common';
import { MonitorService } from './service/monitor.service';
import { MonitorController } from './controller/monitor.controller';
import { NodeService } from '../nodes/service/nodes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nodes } from '../nodes/entity/nodes.entity';
import { AvailabilityEvents } from '../events/entity/availability-events.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([Nodes, AvailabilityEvents ]), HttpModule],
  providers: [MonitorService, NodeService],
  controllers: [MonitorController],
  exports: [MonitorService],
})
export class MonitorModule {}