import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import * as moment from 'moment-timezone';
import { ManyToOne, JoinColumn } from 'typeorm';
import { UserRoles } from 'src/modules/role/entity/role.entity';

@Entity()
export class Users {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  public id: number;

  @ApiProperty()
  @Column({ unique: true })
  public username: string;

  @ApiProperty()
  @Column()
  public password: string;

  @ApiProperty()
  @Column()
  public name: string;

  @ApiProperty()
  @Column()
  public email: string;

  @ApiProperty()
  @ManyToOne(() => UserRoles, { eager: true })
  @JoinColumn({ name: 'role', referencedColumnName: 'id' })
  public role: number;

  @ApiProperty()
  @Column()
  public refresh_token: string;

  @ApiProperty()
  @Column({
    type: 'timestamptz',
  })
  public created_at: Date;

  @ApiProperty()
  @Column({
    type: 'timestamptz',
  })
  public updated_at: Date;
}
