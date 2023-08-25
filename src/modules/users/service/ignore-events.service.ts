import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IgnoreEvents } from '../entity/ignore-events.entity';
import { Repository } from 'typeorm';
import { CreateIgnoreEventsDto } from '../dto/createIgnoreEvent.dto';

@Injectable()
export class IgnoreEventsService {
    constructor(
        @InjectRepository(IgnoreEvents)
        private ignoreEventRepository: Repository<IgnoreEvents>,
    ) { }

    async createIgnoreEvent(ignoreEvents: CreateIgnoreEventsDto[]) {
        for (const ignoreEvent of ignoreEvents) {
            const newIgnoreEvent = await this.ignoreEventRepository.create(ignoreEvent);
            await this.ignoreEventRepository.save(newIgnoreEvent);
        }
    };

    async getIgnoreEventByUsername(username: any) {
        const result = await this.ignoreEventRepository
            .createQueryBuilder('ignore_events')
            .select(
                'ignore_events.event_id AS id'
            )
            .where("ignore_events.username = :username ", {username: username})
            .getRawMany()

        const listIgnoreEvents = result.map((event) => {
            return event.id;
        })
        return listIgnoreEvents;
    }
}