import { IsNotEmpty } from "class-validator";

export class CreateIgnoreEventsDto {
    @IsNotEmpty()
    username: string;

    @IsNotEmpty()
    event_id: string;
}