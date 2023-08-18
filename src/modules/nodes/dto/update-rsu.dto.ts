import { IsOptional } from 'class-validator';

export class UpdateNodeDto {
  @IsOptional()
  name: string;

  @IsOptional()
  typeNode: string;

  @IsOptional()
  status: boolean;
}
