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
  JoinColumn,
} from 'typeorm';

@Entity('door_status')
export class DoorStatus extends AbstractEntity {
  @ApiProperty()
  @Column('text', { name: 'status' })
  status: string;
}
