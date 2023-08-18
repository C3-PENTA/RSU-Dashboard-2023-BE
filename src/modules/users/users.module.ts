import { Module } from '@nestjs/common';
import { UsersService } from './service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entity/users.entity';
import { RoleService } from '../role/service/role.service';
import { UsersController } from './controller/users.controller';
import { UserRoles } from '../role/entity/role.entity';
import { AuthService } from '../auth/service/auth.service';
import { JwtService } from '@nestjs/jwt';


@Module({
  imports: [TypeOrmModule.forFeature([Users]), 
            TypeOrmModule.forFeature([UserRoles]),
            ],
  providers: [UsersService, RoleService, AuthService, JwtService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
