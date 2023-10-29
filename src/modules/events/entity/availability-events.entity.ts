import { ApiProperty } from '@nestjs/swagger';
import { AbstractEntity } from 'src/common/abstract.entity';
import { Nodes } from 'src/modules/nodes/entity/nodes.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

@Entity()
export class AvailabilityEvents extends AbstractEntity {
  @ApiProperty()
  @Column('uuid', { name: 'node_id' })
  nodeId: string;

  @ApiProperty()
  @Column({ name: 'cpu_usage', type: 'integer', nullable: true })
  cpuUsage: number;

  @ApiProperty()
  @Column({ name: 'cpu_temp', type: 'integer', nullable: true })
  cpuTemp: number;

  @ApiProperty()
  @Column({ name: 'ram_usage', type: 'integer', nullable: true })
  ramUsage: number;

  @ApiProperty()
  @Column({ name: 'disk_usage', type: 'integer', nullable: true })
  diskUsage: number;

  @ApiProperty()
  @Column({ name: 'network_speed', type: 'integer', nullable: true })
  networkSpeed: number;

  @ApiProperty()
  @Column({ name: 'network_usage', type: 'integer', nullable: true })
  networkUsage: number;

  @ApiProperty()
  @Column({ name: 'network_status', type: 'integer', nullable: true })
  networkStatus: number;

  @ApiProperty()
  @Column({ name: 'status', type: 'integer' })
  status: number;

  @ApiProperty()
  @Column({ name: 'detail', type: 'varchar', nullable: true })
  detail: string;
}
