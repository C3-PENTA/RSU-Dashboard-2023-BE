import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Policies {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column()
  cpu_limit: number;

  @ApiProperty()
  @Column()
  cpu_thresh: number;

  @ApiProperty()
  @Column()
  num_edges: number;

  @ApiProperty()
  @Column()
  is_activated: boolean;
}
