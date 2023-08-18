import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policies } from './entity/policy.entity';
import { PolicyService } from './service/policy.service';
import { PolicyController } from './controller/policy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Policies])],
  controllers: [PolicyController],
  providers: [PolicyService],
  exports: [PolicyService],
})
export class PolicyModule {}
