import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class PolicyManager {
  @ApiProperty()
  @PrimaryColumn('uuid', { name: 'node_id' })
  nodeID: string;

  @ApiProperty()
  @Column({ name: 'policy_id', type: 'uuid', nullable: true })
  policyID: string;
}
