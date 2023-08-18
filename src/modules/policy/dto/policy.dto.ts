import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePolicyDto {
  @IsOptional()
  name: string;

  @IsOptional()
  cpu_limit: number;

  @IsOptional()
  cpu_thresh: number;

  @IsOptional()
  num_edges: number;

  @IsOptional()
  @IsBoolean()
  is_activated: boolean;
}
