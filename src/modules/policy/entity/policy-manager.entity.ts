import { ApiProperty } from '@nestjs/swagger';
import { Nodes } from 'src/modules/nodes/entity/nodes.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { Policies } from './policy.entity';

@Entity()
export class PolicyManager {
  @ApiProperty()
  @PrimaryColumn('uuid', { name: 'node_id' })
  nodeID: string;

  @ApiProperty()
  @Column({ name: 'policy_id', type: 'uuid', nullable: true })
  policyID: string;

  @OneToOne(() => Nodes)
  @JoinColumn({ name: 'node_id', referencedColumnName: 'id'})
  node: Nodes;

  @OneToOne(() => Policies)
  @JoinColumn({name: 'policy_id', referencedColumnName: 'id'})
  policy: Policies;
}
