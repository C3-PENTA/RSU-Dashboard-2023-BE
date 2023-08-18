import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Policies } from 'src/modules/policy/entity/policy.entity';
import { PolicyService } from 'src/modules/policy/service/policy.service';
import { UpdatePolicyNodeDto } from '../dto/update-policy-node.dto';
import { PolicyManagerService } from '../service/policy-manager.service';
import { USER_ROLE, Roles } from 'src/modules/role/decorator/role.decorator';
import { RolesGuard } from 'src/modules/auth/guard/role.guard';
import { JwtAccessTokenGuard } from 'src/modules/auth/guard/jwt-access-token.guard';
import { UseGuards } from '@nestjs/common';
import { NodeService } from 'src/modules/nodes/service/nodes.service';

@ApiTags('Policy')
@Roles(USER_ROLE.OPERATOR, USER_ROLE.MANAGER)
@UseGuards(JwtAccessTokenGuard, RolesGuard)
@Controller('api/policy-management')
export class PolicyManagerController {
  constructor(
    private policyManagerService: PolicyManagerService,
    private policyService: PolicyService,
    private nodeService: NodeService,
  ) {}

  @Get('list')
  @ApiOperation({
    description: `Get list Policy Manager`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get list succeeded',
  })
  async getPolicyManagerList() {
    const polices: Policies[] = await this.policyService.findAll();
    const nodes = (await this.nodeService.findAll()).nodes;

    return Promise.all(
      polices.map(async (policy: Policies) => {
        const nodeList = await this.policyManagerService.getNodeListByPolicyId(
          policy.id,
        );
        const unAssignedNodes = nodes
          .filter(
            (item1) =>
              !nodeList.some(
                (item2) =>
                  item2.nodeId === item1.id &&
                  item2.nodeName === item1.custom_id,
              ),
          )
          .map((item) => ({
            nodeId: item.id,
            nodeName: item.custom_id,
          }));
        const policyData = await this.policyService.findOne(policy.id);
        return {
          ...policyData,
          assignedNodes: nodeList,
          unAssignedNodes: unAssignedNodes,
        };
      }),
    );
  }

  @Get('policy/:id')
  @ApiOperation({
    description: `Get Policy By Node Id`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get succeeded',
  })
  async getPolicyByNodeId(@Param('id') nodeId: string) {
    return this.policyManagerService.getPolicyByNodeId(nodeId);
  }

  @Patch(':id')
  @ApiBody({ type: UpdatePolicyNodeDto })
  @ApiOperation({ description: 'Update policy for node' })
  @ApiOkResponse({ status: 200, description: 'Update successfully' })
  async updatePolicy(
    @Param('id') nodeId: string,
    @Body() policyData: UpdatePolicyNodeDto,
  ) {
    return this.policyManagerService.updatePolicyNode(nodeId, policyData);
  }
}
