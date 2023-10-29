import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UpdatePolicyDto } from '../dto/policy.dto';
import { PolicyService } from '../service/policy.service';
import { JwtAccessTokenGuard } from 'src/modules/auth/guard/jwt-access-token.guard';
import { USER_ROLE, Roles } from 'src/modules/role/decorator/role.decorator';
import { RolesGuard } from 'src/modules/auth/guard/role.guard';
import { UpdatePolicyNodeDto } from '../dto/update-policy-node.dto';

@ApiTags('Policy')
@Roles(USER_ROLE.OPERATOR, USER_ROLE.MANAGER)
@UseGuards(JwtAccessTokenGuard, RolesGuard)
@Controller('policy-management')
export class PolicyController {
  constructor(
    private policyService: PolicyService,
  ) {}

  @Get('')
  @ApiOperation({
    description: `Get list Policy For Monitoring`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get list succeeded',
  })
  async getPoliciesListMonitoring() {
    return this.policyService.getPoliciesListMonitoring();
  }

  @Patch('policy/:id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdatePolicyDto,
  })
  @ApiOperation({
    description: `Update policy information`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Update policy information successfully',
  })
  async updatePolicy(
    @Param('id') id: string,
    @Body() policyData: UpdatePolicyDto,
  ) {
    return this.policyService.updatePolicy(id, policyData);
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
    return this.policyService.getPolicyByNodeId(nodeId);
  }

  @Patch(':id')
  @ApiBody({ type: UpdatePolicyNodeDto })
  @ApiOperation({ description: 'Update policy for node' })
  @ApiOkResponse({ status: 200, description: 'Update successfully' })
  async updatePolicyManager(
    @Param('id') nodeId: string,
    @Body() policyData: UpdatePolicyNodeDto,
  ) {
    return this.policyService.updatePolicyNode(nodeId, policyData);
  }
}
