export class SummaryItem {
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

export class LatestEvents {
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
