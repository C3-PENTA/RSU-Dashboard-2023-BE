import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class PolicyManager {
  @ApiProperty()
  @PrimaryColumn('uuid')
  node_id: string;

  @ApiProperty()
  @Column()
  policy_id: string;
}
