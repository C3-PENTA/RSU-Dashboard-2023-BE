import {
  Body,
  Controller,
  Param,
  Get,
  Patch,
  Delete,
  UseGuards,
  Request,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from '../service/users.service';
import { CreateUserDto } from '../dto/createUser.dto';
import { UpdateUserDto } from '../dto/updateUser.dto';
import { CreateIgnoreEventsDto } from '../dto/createIgnoreEvent.dto';
import * as bcrypt from 'bcrypt';
import { JwtAccessTokenGuard } from 'src/modules/auth/guard/jwt-access-token.guard';
import { USER_ROLE, Roles } from 'src/modules/role/decorator/role.decorator';
import { RolesGuard } from 'src/modules/auth/guard/role.guard';
import { AuthService } from 'src/modules/auth/service/auth.service';
import { IgnoreEventsService } from '../service/ignore-events.service';

@ApiTags('Users')
@Roles(USER_ROLE.OPERATOR, USER_ROLE.MANAGER)
@UseGuards(JwtAccessTokenGuard, RolesGuard)
@Controller('users')
export class UsersController {
  private saltOrRounds = 10;
  constructor(private usersService: UsersService, private authService: AuthService, private ignoreEventsService: IgnoreEventsService) {}

  @Get('list')
  @ApiOperation({
    description: `Get list User`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get succeeded',
  })
  async getUserList(@Request() req) {
    const currentUser = await this.authService.decodeToken(req.cookies.accessToken);
    const currentRole = currentUser['role'].name;
    if (currentRole == 'OPERATOR')
      return this.usersService.findAll();
    else if (currentRole == 'MANAGER')
      return this.usersService.findMany('NORMAL', 'role');
    else return;
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateUserDto,
  })
  @ApiOperation({
    description: `Update user information`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Update user information successfully',
  })
  async updateUser(@Param('id') id: string, @Body() userData: UpdateUserDto) {
    if (userData.password !== undefined) {
      const hashed_password = await bcrypt.hash(
        userData.password,
        this.saltOrRounds,
      );
      await this.usersService.updateUser(id, {
        ...userData,
        password: hashed_password,
      });
      return {
        message: 'Reset password Successfully',
      };
    }

    await this.usersService.updateUser(id, userData);
    return {
      message: 'Update user information Successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({
    description: `Delete User`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Get succeeded',
  })
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Post('/ignore_event')
  @ApiOperation({
    description: 'Add ignore event for user',
  })
  @ApiOkResponse({
    status: 200,
    description: 'Create succeeded',
  })
  async createIgnoreEvent(@Body() ignoreEventsData: CreateIgnoreEventsDto[]) {
    return this.ignoreEventsService.createIgnoreEvent(ignoreEventsData);
  }

}
