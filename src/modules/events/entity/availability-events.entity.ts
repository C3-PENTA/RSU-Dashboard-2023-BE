import { ApiProperty } from '@nestjs/swagger';
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
export class AvailabilityEvents {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column('uuid')
  node_id: string;

  @ApiProperty()
  @Column()
  cpu_usage: number;

  @ApiProperty()
  @Column()
  cpu_temp: number;

  @ApiProperty()
  @Column()
  ram_usage: number;

  @ApiProperty()
  @Column()
  disk_usage: number;

  @ApiProperty()
  @Column()
  network_speed: number;

  @ApiProperty()
  @Column()
  network_usage: number;

  @ApiProperty()
  @Column()
  network_status: number;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  public created_at: Date;

  @ApiProperty()
  @Column()
  status: number;

  @ApiProperty()
  @Column()
  detail: string;
}
