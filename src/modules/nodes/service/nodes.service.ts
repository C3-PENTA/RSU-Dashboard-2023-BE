/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nodes } from '../entity/nodes.entity';
import { ICreateNode } from '@interface/node.interface';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class NodeService {
  constructor(
    @InjectRepository(Nodes)
    private nodesRepository: Repository<Nodes>,
  ) {}

  async findAll(): Promise<{ nodes: Nodes[]; count: number }> {
    const result = await this.nodesRepository.findAndCount();
    return {
      nodes: result[0],
      count: result[1],
    };
  }

  async findOne(id: Partial<Nodes>): Promise<Nodes> {
    return this.nodesRepository.findOne({
      where: id,
    });
  }

  async createNode(nodeData: ICreateNode) {
    const newNode = new Nodes();
    newNode.rsuID = nodeData.rsuID;
    newNode.name = nodeData.name ?? null;
    newNode.latitude = nodeData.latitude ?? null;
    newNode.longitude = nodeData.longitude ?? null;
    const result = await this.nodesRepository.save(newNode);
    return result;
  }

  async getMapNodeList() {
    const nodes = (await this.findAll()).nodes;
    const customMap = new Map();
    const idMap = new Map();
    for (const node of nodes) {
      customMap.set(node.rsuID, node.id);
      idMap.set(node.id, node.rsuID);
    }
    return { customMap: customMap, idMap: idMap };
  }

  @Cron('* * * * * *')
  async updateStatusNodes() {
    const nodes = await this.nodesRepository.find();
    const now = new Date();

    const updatedNodes = nodes.map((node) => {
      const lastUpdated = node.lastAliveAt;
      const timeDifference = (now.getTime() - lastUpdated.getTime()) / 1000; // in seconds

      let newStatus: number;

      if (timeDifference <= 60) {
        newStatus = 0; // Connected
      } else if (timeDifference <= 180) {
        newStatus = 1; // Unknown
      } else {
        newStatus = 2; // Disconnected
      }

      if (node.status != newStatus) {
        return {
          id: node.id,
          status: newStatus,
          lastUpdated: newStatus == 0 ? now : node.lastAliveAt,
        };
      }
      return null;
    }).filter(Boolean);;

    if (updatedNodes.length > 0) {
      for (let node of updatedNodes) {
        await this.nodesRepository
          .createQueryBuilder()
          .update(Nodes)
          .set({
            status: node.status,
            lastAliveAt: node.lastUpdated,
          })
          .where('id = :id', { id: node.id })
          .execute();
      }
    }
  }
}
