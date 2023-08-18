export interface ResSinglePolicy {
  nodeId: string;
  policy_id: string;
}

export interface ResAllPolices {
  nodeList: any[];
  id: string;
  name: string;
  cpu_limit: number;
  cpu_thresh: number;
  num_edges: number;
  is_activated: boolean;
}

export interface ResPolices {
  id: string;
  name: string;
  nodeName: string;
  description: string;
  cpu_limit: number;
  cpu_thresh: number;
  num_edges: number;
  is_activated: boolean;
}

export interface ResPoliceByNodeId {
  nodeId: string;
  nodeName: string;
  policy_id: string;
  name: string;
  cpu_limit: number;
  cpu_thresh: number;
  num_edges: number;
  is_activated: boolean;
}
