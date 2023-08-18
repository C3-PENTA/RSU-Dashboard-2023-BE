/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nodes } from '../entity/nodes.entity';
import { AvailabilityEvents } from 'src/modules/events/entity/availability-events.entity';

@Injectable()
export class NodeService {
  constructor(
    @InjectRepository(Nodes)
    private nodesRepository: Repository<Nodes>,
    @InjectRepository(AvailabilityEvents)
    private availEventRepository: Repository<AvailabilityEvents>,
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

  async getRSUUsage(type: string, period: string): Promise<any> {
    const listNodeLive = await this.nodesRepository
      .createQueryBuilder('nodes')
      .select(['id', 'custom_id'])
      .orderBy('custom_id', 'ASC')
      .execute() as Promise<Nodes[]>;
    
    let result = [];
    await Promise.all(
      (await listNodeLive).map(async (rsu) => {
        try {
          const fromDate = new Date();
          const now = new Date();

          let rsuUsage;

          // Last 30 days
          if (period === 'month') {
            fromDate.setDate(fromDate.getDate() - 30);
  
            rsuUsage = await this.availEventRepository
              .createQueryBuilder('event')
              .select(`DATE(event.created_at) AS timestamp, AVG(event.${type}_usage) AS average`)
              .where('event.node_id = :rsuId AND event.created_at >= :fromDate  AND event.created_at <= :now', { rsuId: rsu.id, fromDate, now })
              .groupBy('DATE(event.created_at)')
              .orderBy('timestamp')
              .execute() as Promise<{ date: string, average: number }[]>;
          }
          // Last 24 hours
          if (period === 'date') {
            fromDate.setHours(fromDate.getHours() - 24);

            rsuUsage = await this.availEventRepository
              .createQueryBuilder('usage')
              .select(`DATE_TRUNC('hour', usage.created_at) AS timestamp, AVG(usage.${type}_usage) AS average`)
              .where('usage.node_id = :rsuId AND usage.created_at >= :fromDate AND usage.created_at <= :now', { rsuId: rsu.id, fromDate, now })
              .groupBy("DATE_TRUNC('hour', usage.created_at)")
              .orderBy('timestamp')
              .execute() as Promise<{ hour: Date, average: number }[]>;
          }
          // Last 60 minutes
          if (period === 'hour') {
            fromDate.setMinutes(fromDate.getMinutes() - 60);

            rsuUsage = await this.availEventRepository
              .createQueryBuilder('usage')
              .select(`DATE_TRUNC('minute', usage.created_at) AS timestamp, AVG(usage.${type}_usage) AS average`)
              .where('usage.node_id = :rsuId AND usage.created_at >= :fromDate AND usage.created_at <= :now', { rsuId: rsu.id, fromDate, now })
              .groupBy("DATE_TRUNC('minute', usage.created_at)")
              .orderBy('timestamp')
              .execute() as Promise<{ minute: string, average: number }[]>;
          }
          rsuUsage !== undefined && rsuUsage.length !== 0 && result.push({
            id: rsu.custom_id,
            usage: rsuUsage,
          });
          
        } catch (error) {
          console.error(error);
        } 
      })
    );
    return result.sort((a, b) => a.id.localeCompare(b.id))
  }
}
