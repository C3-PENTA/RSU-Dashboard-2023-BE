/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nodes } from '../entity/nodes.entity';

@Injectable()
export class NodeService {
  constructor(
    @InjectRepository(Nodes)
    private nodesRepository: Repository<Nodes>,
  ) {}

  async findAll(): Promise<{nodes: Nodes[], count: number}> {
    const result = await this.nodesRepository.findAndCount()
    return {
      nodes: result[0],
      count: result[1],
    }
  }

  async findOne(id: Partial<Nodes>): Promise<Nodes> { 
    return this.nodesRepository.findOne({
      where: id,
    });
  }

  async getMapNodeList() {
    const nodes = (await this.findAll()).nodes;
    const customMap = new Map();
    const idMap = new Map();
    for (const node of nodes) {
      customMap.set(node.custom_id, node.id);
      idMap.set(node.id, node.custom_id);
    }
    return { customMap: customMap, idMap: idMap};
  }
}
