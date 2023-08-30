/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodeController } from './controller/node.controller';
import { NodeService } from './service/nodes.service';
import { HttpModule } from '@nestjs/axios';
import { Nodes } from './entity/nodes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Nodes]), HttpModule],
  controllers: [NodeController],
  providers: [NodeService],
  exports: [NodeService],
})
export class NodeModule {}
