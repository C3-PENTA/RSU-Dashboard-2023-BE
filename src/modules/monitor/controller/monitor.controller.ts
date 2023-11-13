import {
  Body,
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
import { ApiKeyAuthGuard } from 'src/modules/auth/guard/api-key.guard';
import { AvailEventDTO, CommEventListDTO, DoorStatusDTO, KeepAliveDTO } from '../dto/event-prop.dto';

@ApiTags('Monitor management')
@Controller('')
export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  @Get('monitor-management/auto-refresh')
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

  @Post('monitor-management/auto-refresh/:state')
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

  @Get('monitor-management/metadata')
  @UseGuards(JwtAccessTokenGuard)
  @ApiOperation({ description: 'Get metadata' })
  async getMetadata() {
    return this.monitorService.getMetadata();
  }

  @Post('edge/status')
  // @UseGuards(ApiKeyAuthGuard)
  @ApiBody({
    description: '',
    type: AvailEventDTO,
  })
  async getEdgeStatus(@Body() body: AvailEventDTO) {
    console.log('Data receive: ', body);
    return this.monitorService.getEdgeStatus(body);
  }

  @Post('edge/message')
  // @UseGuards(ApiKeyAuthGuard)
  @ApiBody({
    description: '',
    type: CommEventListDTO,
  })
  async getEdgeMessageList(@Body() body: CommEventListDTO) {
    console.log('Data receive: ', body);
    return this.monitorService.getEdgeMessageList(body);
  }

  @Post('edge/keepalive')
  // @UseGuards(ApiKeyAuthGuard)
  @ApiBody({
    description: '',
    type: KeepAliveDTO,
  })
  getEdgeKeepAlive(@Body() body: KeepAliveDTO) {
    console.log('Data receive: ', body);
    return this.monitorService.getEdgeKeepAlive(body);
  }

  @Post('sensor/door-status')
  // @UseGuards(ApiKeyAuthGuard)
  @ApiBody({
    description: '',
    type: DoorStatusDTO,
  })
  getDoorStatus(@Body() body: DoorStatusDTO) {
    console.log('Data receive: ', body);
    return this.monitorService.getDoorStatus(body);
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
}
