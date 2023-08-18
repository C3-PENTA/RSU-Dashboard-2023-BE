import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyManager } from './entity/policy-manager.entity';
import { PolicyManagerController } from './controller/policy-manager.controller';
import { PolicyManagerService } from './service/policy-manager.service';
import { PolicyService } from '../policy/service/policy.service';
import { Policies } from '../policy/entity/policy.entity';
import { NodeService } from '../nodes/service/nodes.service';
import { Nodes } from '../nodes/entity/nodes.entity';
import { AvailabilityEvents } from '../events/entity/availability-events.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PolicyManager, Policies, Nodes, AvailabilityEvents]),
  ],
  controllers: [PolicyManagerController],
  providers: [PolicyManagerService, PolicyService, NodeService],
  exports: [PolicyManagerService],
})
export class PolicyManagerModule {}
