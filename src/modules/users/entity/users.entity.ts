import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ManyToOne, JoinColumn } from 'typeorm';
import { UserRoles } from 'src/modules/role/entity/role.entity';
import { AbstractEntity } from 'src/common/abstract.entity';

@Entity()
export class Users extends AbstractEntity {
  @ApiProperty()
  @Column({ name: 'username', type: 'varchar', unique: true })
  public username: string;

  @ApiProperty()
  @Column({ name: 'password', type: 'varchar', nullable: true })
  public password: string;

  @ApiProperty()
  @Column({ name: 'name', type: 'varchar', nullable: true })
  public name: string;

  @ApiProperty()
  @Column({ name: 'email', type: 'varchar', nullable: true })
  public email: string;

  @ApiProperty()
  @Column({ name: 'refresh_token', type: 'varchar', nullable: true })
  public refreshToken: string;

  @ApiProperty()
  @ManyToOne(() => UserRoles, { eager: true })
  @JoinColumn({ name: 'role', referencedColumnName: 'id' })
  public role: number;
}
