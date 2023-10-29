import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { UsersService } from '../users/service/users.service';
import { LocalStrategy } from './strategy/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessStrategy } from './strategy/jwt-access-token.strategy';
import { JwtRefreshTokenStrategy } from './strategy/jwt-refresh-token.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../users/entity/users.entity';
import { RoleService } from '../role/service/role.service';
import { UserRoles } from '../role/entity/role.entity';
import { ApiKeyStrategy } from './strategy/api-key.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users]),
    TypeOrmModule.forFeature([UserRoles]),
    PassportModule,
    JwtModule.register({}),
  ],
  providers: [
    AuthService,
    UsersService,
    LocalStrategy,
    JwtAccessStrategy,
    JwtRefreshTokenStrategy,
    ApiKeyStrategy,
    RoleService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
