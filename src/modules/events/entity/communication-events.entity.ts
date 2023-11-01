import { ApiProperty } from '@nestjs/swagger';
import { AbstractEntity } from 'src/common/abstract.entity';
import { Nodes } from 'src/modules/nodes/entity/nodes.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class CommunicationEvents extends AbstractEntity{
  @ApiProperty()
  @Column({ name: 'node_id', type: 'uuid' })
  nodeId: string;

  @ApiProperty()
  @Column({ name: 'cooperation_class', type: 'varchar', nullable: true })
  cooperationClass: string;

  @ApiProperty()
  @Column({ name: 'method', type: 'varchar', nullable: true })
  method: string;

  @ApiProperty()
  @Column({ name: 'communication_class', type: 'varchar', nullable: true })
  communicationClass: string;

  @ApiProperty()
  @Column({ name: 'src_node', type: 'uuid', nullable: true })
  srcNode?: string;

  @ApiProperty()
  @Column({ name: 'dest_node', type: 'uuid', nullable: true })
  destNode?: string;

  @ApiProperty()
  @Column({ name: 'session_id', type: 'varchar', nullable: true })
  sessionId?: string;

  @ApiProperty()
  @Column({ name: 'message_type', type: 'varchar', nullable: true })
  messageType: string;

  @ApiProperty()
  @Column({ name: 'status', type: 'integer' })
  status: number;

  @ApiProperty()
  @Column({ name: 'detail', type: 'varchar', nullable: true })
  detail: string;

  @ManyToOne(() => Nodes)
  @JoinColumn({ name: 'node_id', referencedColumnName: 'id'})
  node: Nodes;

  @ManyToOne(() => Nodes)
  @JoinColumn({ name: 'src_node', referencedColumnName: 'id'})
  senderNode: Nodes;

  @ManyToOne(() => Nodes)
  @JoinColumn({ name: 'dest_node', referencedColumnName: 'id'})
  receiverNode: Nodes;
}
