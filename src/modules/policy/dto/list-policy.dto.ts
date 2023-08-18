import { ApiProperty } from '@nestjs/swagger';
import { Policies } from '../entity/policy.entity';

export class ListPolicyDto {
  @ApiProperty({ type: Policies, isArray: true })
  listPolicy: Policies[];
}
