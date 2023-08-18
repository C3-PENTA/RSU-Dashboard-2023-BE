import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class UserRoles {
  @ApiProperty()
  @PrimaryColumn()
  public id?: number;

  @ApiProperty()
  @Column({ unique: true })
  public name: string;
}
