/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { AvailabilityEvents } from 'src/modules/events/entity/availability-events.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
@Entity()
export class Nodes {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  custom_id: string;

  @ApiProperty()
  @Column()
  status: boolean;

  @ApiProperty()
  @Column()
  dns: string;

  @ApiProperty()
  @Column()
  latitude: number;

  @ApiProperty()
  @Column()
  longitude: number;
  
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  public created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
    onUpdate: 'now()',
  })
  public updated_at: Date;
}
