import { IsOptional } from 'class-validator';
import { CreateDateColumn } from 'typeorm';

export class AddUsage {
  @IsOptional()
  rsu_id: number;  

  @IsOptional()
  ram: number;

  @IsOptional()
  used_disk: number;

  @IsOptional()
  total_disk: number;

  @IsOptional()
  cpu: number;

  @IsOptional()
  network_in: number;

  @IsOptional()
  network_out: number;

  @IsOptional()
  bandwidth: number;

}
