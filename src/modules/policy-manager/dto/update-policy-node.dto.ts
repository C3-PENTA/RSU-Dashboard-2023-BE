import { ApiProperty } from '@nestjs/swagger';

export class UpdatePolicyNodeDto {
  @ApiProperty({ type: 'string' })
  policy_id: string;
}