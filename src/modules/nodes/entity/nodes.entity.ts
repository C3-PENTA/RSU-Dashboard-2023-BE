import { ApiProperty } from '@nestjs/swagger';
import { AbstractEntity } from 'src/common/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class Nodes extends AbstractEntity {
  @ApiProperty()
  @Column({ name: 'rsu_id', type: 'varchar' })
  rsuID: string;

  @ApiProperty()
  @Column({ name: 'name', type: 'varchar', nullable: true })
  name: string;

  @ApiProperty()
  @Column({ name: 'status', type: 'integer', nullable: true })
  status: number;

  @ApiProperty()
  @Column({
    name: 'last_alive_at',
    type: 'timestamptz',
    nullable: true,
    default: () => 'now()'
  })
  lastAliveAt: Date;

  @ApiProperty()
  @Column({ name: 'latitude', type: 'double precision', nullable: true })
  latitude: number;

  @ApiProperty()
  @Column({ name: 'longitude', type: 'double precision', nullable: true })
  longitude: number;
}
