import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MonitorService } from '../service/monitor.service';
import { USER_ROLE, Roles } from 'src/modules/role/decorator/role.decorator';
import { RolesGuard } from 'src/modules/auth/guard/role.guard';
import { JwtAccessTokenGuard } from 'src/modules/auth/guard/jwt-access-token.guard';

@ApiTags('Monitor management')
@Controller('monitor-management')
export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  @Get('auto-refresh')
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

  @Post('auto-refresh/:state')
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

  @Get('metadata')
  @UseGuards(JwtAccessTokenGuard)
  @ApiOperation({ description: 'Get metadata' })
  async getMetadata() {
    return this.monitorService.getMetadata();
  }

  @Get('edge-connection')
  @ApiOperation({ description: 'Get status of Edge System Connection'})
  getStatusEdgeSystemConnection() {
    const status = this.monitorService.getStatusKeepAlive();
    return { x: status };
  }

  // @Get('generator/status')
  // @Roles(USER_ROLE.OPERATOR)
  // @UseGuards(JwtAccessTokenGuard, RolesGuard)
  // async getStatusGenerator() {
  //   const status = this.monitorService.isCronJobEnabled ? 'ON' : 'OFF';
  //   return { status: status };
  // }

  // @Post('generator/toggle')
  // @Roles(USER_ROLE.OPERATOR)
  // @UseGuards(JwtAccessTokenGuard, RolesGuard)
  // async toggleGenerator() {
  //   this.monitorService.isCronJobEnabled =
  //     !this.monitorService.isCronJobEnabled;
  //   const status = this.monitorService.isCronJobEnabled ? 'ON' : 'OFF';
  //   return { status: status };
  // }

  // @Post('generator/avail-event-prop')
  // @Roles(USER_ROLE.OPERATOR)
  // @UseGuards(JwtAccessTokenGuard, RolesGuard)
  // @ApiOperation({
  //   summary: 'Form to adjust properties of generating availability event',
  // })
  // @ApiBody({
  //   description: 'Enter properties',
  //   type: AvailEventPropDTO,
  // })
  // async changeAvailEventProp(@Body() prop: AvailEventPropDTO) {
  //   return this.monitorService.changeAvailEventProp(prop);
  // }

  // @Post('generator/comm-event-prop')
  // @Roles(USER_ROLE.OPERATOR)
  // @UseGuards(JwtAccessTokenGuard, RolesGuard)
  // @ApiOperation({
  //   summary: 'Form to adjust properties of generating communication event',
  // })
  // @ApiBody({
  //   description: 'Enter properties',
  //   type: CommEventPropDTO,
  // })
  // async changeCommEventProp(@Body() prop: CommEventPropDTO) {
  //   return this.monitorService.changeCommEventProp(prop);
  // }

  // @Get('edge/status')
  // @UseGuards(ApiKeyAuthGuard)
  // async getEdgeStatusList() {
  //   const statusList = await this.monitorService.genAvailEvents();
  //   return {
  //     statusList: statusList,
  //   };
  // }

  // @Get('edge/message')
  // @UseGuards(ApiKeyAuthGuard)
  // async getEdgeMessageList() {
  //   const messageList = await this.monitorService.genCommEvents();
  //   return {
  //     messageList: messageList,
  //   };
  // }
}
