import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class IgnoreEvents {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @ApiProperty()
    @Column()
    public username: string;

    @ApiProperty()
    @Column('uuid')
    public event_id: string;
}
