export interface SummaryItemInf {
  nodeId: string;
  totalAvailabilityNormal?: number;
  totalAvailabilityError?: number;
  totalCommunicationNormal?: number;
  totalCommunicationError?: number;
  percentAvailabilityNormal?: number | string;
  percentAvailabilityError?: number | string;
  percentTotalAvailability?: number | string;
  percentCommunicationNormal?: number | string;
  percentCommunicationError?: number | string;
  percentTotalCommunication?: number | string;
}

export interface LatestEventInf {
  id: string;
  node_id: string;
  cpu_usage: number;
  cpu_temp: number;
  ram_usage: number;
  disk_usage: number;
  network_speed: number;
  network_usage: number;
  network_status: number;
  detail: string;
  status: string;
  created_at: Date;
}

export class IAvailEvent {
  timeStamp: number;
  nodeID: string;
  rsuName: string;
  cpuUsage: number;
  cpuTemperature: number;
  ramUsage: number;
  diskUsage: number;
  rsuConnection: boolean;
  networkSpeed: number;
  networkUsage: number;
  latitude: number;
  longitude: number;
}

export class ICommEvent {
  timeStamp: number;
  nodeID: string;
  rsuName: string;
  cooperationClass: string;
  sessionID: number;
  communicationType: string;
  senderNodeID: string;
  receiverNodeID: string;
  messageType: string;
  messageData: string;
}

export class ICommEventList {
  messageList: ICommEvent[];
}

export class IKeepAliveMessage {
  timeStamp: number;
}