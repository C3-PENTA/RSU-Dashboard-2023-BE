import { ApiProperty } from '@nestjs/swagger';

export class UpdatePolicyNodeDto {
  @ApiProperty({ type: 'string' })
  policyID: string;
}