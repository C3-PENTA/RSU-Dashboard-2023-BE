import { Module } from '@nestjs/common';
import { RoleService } from './service/role.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRoles } from './entity/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserRoles])],
  providers: [RoleService],
})
export class RoleModule {}
