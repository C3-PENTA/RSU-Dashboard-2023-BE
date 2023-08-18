import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({ type: 'string' })
  username: string;

  @ApiProperty({ type: 'string' })
  password: string;
}
