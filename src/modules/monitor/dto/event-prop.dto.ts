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

export class AvailEventDTO {
  @ApiProperty({type: 'number'})
  timeStamp: number;

  @ApiProperty({type: 'string'})
  nodeID: string;
  
  @ApiProperty({type: 'string'})
  rsuName: string;
  
  @ApiProperty({type: 'number'})
  cpuUsage: number;

  @ApiProperty({type: 'number'})
  cpuTemperature: number;

  @ApiProperty({type: 'number'})
  ramUsage: number;

  @ApiProperty({type: 'number'})
  diskUsage: number;

  @ApiProperty({type: 'boolean'})
  rsuConnection: boolean;
  
  @ApiProperty({type: 'number'})
  networkSpeed: number;

  @ApiProperty({type: 'number'})
  networkUsage: number;

  @ApiProperty({type: 'number'})
  latitude: number;

  @ApiProperty({type: 'number'})
  longitude: number;
}

export class CommEventDTO {
  @ApiProperty({type: 'number'})
  timeStamp: number;

  @ApiProperty({type: 'string'})
  nodeID: string;

  @ApiProperty({type: 'string'})
  rsuName: string;

  @ApiProperty({type: 'string'})
  cooperationClass: string;

  @ApiProperty({type: 'number'})
  sessionID: number;
  
  @ApiProperty({type: 'string'})
  communicationType: string;

  @ApiProperty({type: 'string'})
  senderNodeID: string;

  @ApiProperty({type: 'string'})
  receiverNodeID: string;

  @ApiProperty({type: 'string'})
  messageType: string;

  @ApiProperty({type: 'string'})
  messageData: string;
}

export class CommEventListDTO {
  @ApiProperty({ type: [CommEventDTO] })
  @ValidateNested({ each: true })
  messageList: CommEventDTO[];
}

export class KeepAliveDTO {
  @ApiProperty({type: 'number'})
  timeStamp: number;
}