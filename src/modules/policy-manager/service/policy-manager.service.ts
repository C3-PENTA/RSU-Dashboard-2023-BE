import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyManager } from '../entity/policy-manager.entity';
import { Policies } from 'src/modules/policy/entity/policy.entity';
import { UpdatePolicyNodeDto } from '../dto/update-policy-node.dto';
import { ResSinglePolicy, ResPoliceByNodeId } from '../interfaces';
import { Nodes } from 'src/modules/nodes/entity/nodes.entity';

@Injectable()
export class PolicyManagerService {
  constructor(
    @InjectRepository(PolicyManager)
    private policyManagerRepository: Repository<PolicyManager>,
  ) {}

  async findAll(): Promise<ResSinglePolicy[]> {
    return this.policyManagerRepository
      .createQueryBuilder('policy_manager')
      .select(['policy_manager.node_id', 'policy_manager.policy_id'])
      .execute() as Promise<ResSinglePolicy[]>;
  }

  async updatePolicyNode(nodeId: string, data: UpdatePolicyNodeDto) {
    await this.policyManagerRepository.update(nodeId, data);
    return this.policyManagerRepository.findOne(nodeId);
  }

  async getNodeListByPolicyId(policyId: string) {
    return this.policyManagerRepository
      .createQueryBuilder('policy_manager')
      .select([
        'node.id as "nodeId"',
        'node.custom_id as "nodeName"',
      ])
      .innerJoin(Policies, 'policy', 'policy.id = policy_manager.policy_id')
      .innerJoin(Nodes, 'node', 'node.id = policy_manager.node_id')
      .where({
        policy_id: policyId,
      })
      .getRawMany();
  }

  async getPolicyByNodeId(nodeId: string) {
    return this.policyManagerRepository
      .createQueryBuilder('policy_manager')
      .select([
        'node.id as "nodeId"',
        'node.custom_id as "nodeName"',
        'policy.id as "policyId"',
        'policy.name as "policyName"',
        'policy.cpu_thresh as "cpuOverPercent"',
        'policy.cpu_limit as "cpuLessThanPercent"',
        'policy.num_edges as "numberResendNode"',
        'policy.is_activated as "activated"',
      ])
      .leftJoin(Nodes, 'node', 'node.id = policy_manager.node_id')
      .leftJoin(Policies, 'policy', 'policy.id = policy_manager.policy_id')
      .where('policy_manager.node_id = :nodeId', { nodeId: nodeId })
      .getRawMany();
  }
}
