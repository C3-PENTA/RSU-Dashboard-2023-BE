import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Users } from './users.entity';
import { AvailabilityEvents } from 'src/modules/events/entity/availability-events.entity';
import { CommunicationEvents } from 'src/modules/events/entity/communication-events.entity';

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

    @ManyToOne(() => Users)
    @JoinColumn({ name: 'username', referencedColumnName: 'username'})
    user: Users;
  
    @ManyToOne(() => AvailabilityEvents)
    @JoinColumn({name: 'event_id', referencedColumnName: 'id'})
    availEvent: AvailabilityEvents;

    // @ManyToOne(() => CommunicationEvents)
    // @JoinColumn({name: 'event_id', referencedColumnName: 'id'})
    // commEvent: CommunicationEvents;
}
