import { Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MonitorService } from '../service/monitor.service';
import { USER_ROLE, Roles } from 'src/modules/role/decorator/role.decorator';
import { RolesGuard } from 'src/modules/auth/guard/role.guard';
import { JwtAccessTokenGuard } from 'src/modules/auth/guard/jwt-access-token.guard';

@ApiTags('Monitor management')
@Controller('api/monitor-management')
export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  @Get('/auto-refresh')
  @UseGuards(JwtAccessTokenGuard)
  @ApiOperation({
    description: `Get list auto refresh`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get succeeded',
  })
  async getSharedAutoRefresh() {
    return this.monitorService.getAutoRefresh();
  }


  @Post('/auto-refresh/:state')
  @Roles(USER_ROLE.OPERATOR)
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @ApiOperation({
    description: `Get list auto refresh`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get succeeded',
  })
  async updateSharedAutoRefresh(@Param('state') state: boolean) {
    return this.monitorService.setAutoRefresh(state);
  }

  @Get('/metadata')
  @UseGuards(JwtAccessTokenGuard)
  @ApiOperation({ description: 'Get metadata'})
  async getMetadata() {
    return this.monitorService.getMetadata();
  }
}
