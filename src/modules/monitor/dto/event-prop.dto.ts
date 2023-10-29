import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

class RangeDTO {
  @ApiProperty()
  @IsNumber()
  min: number;

  @ApiProperty()
  @IsNumber()
  max: number;
}

class NodePropDTO {
	@ApiProperty()
  nodeID: string;

	@ApiProperty()
  rsuName: string;

	@ApiProperty()
  latitude: number;

	@ApiProperty()
	@IsNumber()
  longitude: number;
}

export class AvailEventPropDTO {
  @ApiProperty({ type: NodePropDTO, isArray: true })
  @ValidateNested({ each: true })
  nodes: NodePropDTO[];

  @ApiProperty({ type: RangeDTO })
  @ValidateNested()
  cpuUsage: RangeDTO;

  @ApiProperty({ type: RangeDTO })
  @ValidateNested()
  cpuTemperature: RangeDTO;

  @ApiProperty({ type: RangeDTO })
  @ValidateNested()
  ramUsage: RangeDTO;

  @ApiProperty({ type: RangeDTO })
  @ValidateNested()
  diskUsage: RangeDTO;

  @ApiProperty({ type: RangeDTO })
  @ValidateNested()
  networkSpeed: RangeDTO;

  @ApiProperty({ type: RangeDTO })
  @ValidateNested()
  networkUsage: RangeDTO;
}

export class CommEventPropDTO {
  @ApiProperty({ type: [NodePropDTO] })
  @ValidateNested({ each: true })
  nodes: NodePropDTO[];

  @ApiProperty()
  @IsString({ each: true })
  cooperationClass: string[];

  @ApiProperty({ type: RangeDTO })
  @ValidateNested()
  sessionID: RangeDTO;

  @ApiProperty()
  @IsString({ each: true })
  messageType: string[];
}


