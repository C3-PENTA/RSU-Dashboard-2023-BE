import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { NodeService } from '../service/nodes.service';
import { API_PATH } from 'src/constants';
import { JwtAccessTokenGuard } from 'src/modules/auth/guard/jwt-access-token.guard';

@ApiTags('RSU Server API')
@UseGuards(JwtAccessTokenGuard)
@Controller('rsu')
export class NodeController {
  constructor(private nodeService: NodeService) {}

  @Get(API_PATH.GET_RSU_INFORMATION)
  @ApiOperation({
    description: '',
  })
  @ApiOkResponse({
    status: 200,
    description: ''
  })
  async getAllNodes() {
    return this.nodeService.findAll();
  }
}
