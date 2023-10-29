import { ApiProperty } from '@nestjs/swagger';
import { AbstractEntity } from 'src/common/abstract.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Policies extends AbstractEntity {
  @ApiProperty()
  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @ApiProperty()
  @Column({ name: 'cpu_limit', type: 'integer'})
  cpuLimit!: number;

  @ApiProperty()
  @Column({ name: 'cpu_thresh', type: 'integer' })
  cpuThresh!: number;

  @ApiProperty()
  @Column({ name: 'num_edges', type: 'integer'})
  numEdges: number;

  @ApiProperty()
  @Column({ name: 'is_activated', type: 'boolean'})
  isActivated: boolean;
}
