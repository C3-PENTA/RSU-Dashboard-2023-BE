import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class CommunicationEvents {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column('uuid')
  node_id: string;

  @ApiProperty()
  @Column()
  driving_negotiations_class: number;

  @ApiProperty()
  @Column()
  method: number;

  @ApiProperty()
  @Column('uuid')
  src_node?: string;

  @ApiProperty()
  @Column('uuid')
  dest_node?: string;

  @ApiProperty()
  @Column()
  message_type: number;


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
