import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policies } from './entity/policy.entity';
import { PolicyService } from './service/policy.service';
import { PolicyController } from './controller/policy.controller';
import { PolicyManager } from './entity/policy-manager.entity';
import { NodeService } from '../nodes/service/nodes.service';
import { Nodes } from '../nodes/entity/nodes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Policies, PolicyManager, Nodes])],
  controllers: [PolicyController],
  providers: [PolicyService, NodeService],
  exports: [PolicyService],
})
export class PolicyModule {}
