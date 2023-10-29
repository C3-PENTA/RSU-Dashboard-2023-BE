import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdatePolicyDto } from '../dto/policy.dto';
import { Policies } from '../entity/policy.entity';
import { PolicyManager } from '../entity/policy-manager.entity';
import { Nodes } from 'src/modules/nodes/entity/nodes.entity';
import { UpdatePolicyNodeDto } from '../dto/update-policy-node.dto';
import { NodeService } from 'src/modules/nodes/service/nodes.service';

interface nodeOfPolicyInf {
  nodeID: string;
  rsuID: string;
}

export interface PolicyDetailInf {
  policyID: string;
  policyName: string;
  cpuThresholdSelf: number;
  cpuThresholdDist: number;
  numTargets: number;
  isActivated: boolean;
  description: string;
  assignedNodes: nodeOfPolicyInf[];
  unAssignedNodes: nodeOfPolicyInf[];
}

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(Policies)
    private policyRepo: Repository<Policies>,
    @InjectRepository(PolicyManager)
    private policyMngRepo: Repository<PolicyManager>,
    private nodeService: NodeService,
  ) {}

  async getPoliciesListMonitoring() {
    const nodeList = (await this.nodeService.findAll()).nodes;

    const dataQuery = await this.policyRepo
      .createQueryBuilder('policy')
      .select([
        'policy.id AS "policyID"',
        'policy.name AS "policyName"',
        'policy.cpu_limit AS "cpuThresholdSelf"',
        'policy.cpu_thresh AS "cpuThresholdDist"',
        'policy.num_edges AS "numTargets"',
        'policy.is_activated AS "isActivated"',
        'node.id AS "nodeID"',
        'node.rsu_id AS "rsuID"',
      ])
      .leftJoin(PolicyManager, 'policy_mng', 'policy.id = policy_mng.policy_id')
      .leftJoin(Nodes, 'node', 'policy_mng.node_id = node.id')
      .orderBy('policy.name', 'ASC')
      .getRawMany();

    const groupedData = dataQuery.reduce((acc, item) => {
      if (!acc[item.policyID]) {
        acc[item.policyID] = {
          policyID: item.policyID,
          policyName: item.policyName,
          cpuThresholdSelf: item.cpuThresholdSelf,
          cpuThresholdDist: item.cpuThresholdDist,
          numTargets: item.numTargets,
          isActivated: item.isActivated,
          description:
            `When a file is sent to an RSU, it will first check its CPU usage. ` +
            `If the CPU usage is greater than ${item.cpuThresholdSelf}%, the RSU will distribute the file itself. ` +
            `Otherwise, it will seek ${item.numTargets} other RSU ` +
            `whose CPU usage is less than ${item.cpuThresholdDist}% and send the file to them`,
          assignedNodes: [],
          unAssignedNodes: [],
        };
      }

      if (item.nodeID && item.rsuID) {
        acc[item.policyID].assignedNodes.push({
          nodeID: item.nodeID,
          rsuID: item.rsuID,
        });
      }
      return acc;
    }, {});

    const result : PolicyDetailInf[] = Object.values(groupedData);

    result.forEach((policy) => {
      const assignedNodesIDs = new Set(
        policy.assignedNodes.map((node) => node.nodeID),
      );
      const unAssignedNodes = nodeList
        .filter((node) => !assignedNodesIDs.has(node.id))
        .map(({ id, rsuID }) => ({
          nodeID: id,
          rsuID: rsuID,
        }));
        policy.unAssignedNodes.push(...unAssignedNodes);
    });
    return result;
  }

  async findOne(id: string) {
    const policyData: Policies = await this.policyRepo.findOne({
      id,
    });
    const description =
      `When a file is sent to an RSU, it will first check its CPU usage. ` +
      `If the CPU usage is greater than ${policyData.cpuLimit}%, the RSU will distribute the file itself. ` +
      `Otherwise, it will seek ${policyData.numEdges} other RSU ` +
      `whose CPU usage is less than ${policyData.cpuThresh}% and send the file to them`;
    return {
      ...policyData,
      description: description,
    };
  }

  async updatePolicy(id: string, data: UpdatePolicyDto) {
    await this.policyRepo.update(id, data);
    return this.findOne(id);
  }

  async getNodeListByPolicyId(policyId: string) {
    return this.policyMngRepo
      .createQueryBuilder('policy_manager')
      .select(['node.id as "nodeId"', 'node.rsu_id as "nodeName"'])
      .innerJoin(Policies, 'policy', 'policy.id = policy_manager.policy_id')
      .innerJoin(Nodes, 'node', 'node.id = policy_manager.node_id')
      .where({
        policyId: policyId,
      })
      .getRawMany();
  }

  async getPolicyByNodeId(nodeId: string) {
    return this.policyMngRepo
      .createQueryBuilder('policy_manager')
      .select([
        'node.id as "nodeId"',
        'node.rsu_id as "nodeName"',
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

  async updatePolicyNode(nodeId: string, data: UpdatePolicyNodeDto) {
    await this.policyMngRepo.update(nodeId, data);
    return this.policyMngRepo.findOne(nodeId);
  }
}
