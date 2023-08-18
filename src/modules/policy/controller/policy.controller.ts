import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
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

@ApiTags('Policy')
@Roles(USER_ROLE.OPERATOR, USER_ROLE.MANAGER)
@UseGuards(JwtAccessTokenGuard, RolesGuard)
@Controller('api/policy-management')
export class PolicyController {
  constructor(private policyService: PolicyService) {}

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
}
