export const API_PATH = {
  GET_LIST_NODE: '/node/list',
  GET_CONNECTION: '/node/connection',
  GET_DASHBOARD: '/node/dashboard',
  GET_USAGE: '/node/usage',
  GEN_USAGE: '/node/add-usage',
  GET_RSU_USAGE: '/rsu-usage',
  GET_RSU_INFORMATION: ''
};

export const Role = {
  ROOT: 'ROOT',
  ADMIN: 'ADMIN',
  NORMAL: 'NORMAL',
};


export const Event_Key = {
  OCCURRENCE_TIME: '발생 시간',
  NODE_ID: '노드 ID',
  NODE_TYPE: 'RSU 명칭',
  CPU_USAGE: 'CPU 사용량',
  CPU_TEMPERATURE: 'CPU 온도',
  RAM_USAGE: 'RAM 사용량',
  DISK_USAGE: 'DISK 사용량',
  NETWORK_SPEED: '네트워크 속도',
  NETWORK_USAGE: '네트워크 사용량',
  NETWORK_CONNECTION_STATUS: '네트워크 연결 상태',
  DETAIL: '오류 상세',
  SRC_NODE: '송신 노드',
  DEST_NODE: '수신 노드',
  COOPERATION_CLASS: 'Cooperation Class',
  SESSION_ID: 'Session ID',
  COMMUNICATION_CLASS: 'Communication Class',
  MESSAGE_TYPE: '메시지 종류',
  METHOD: '통신 방법'
};

export enum EventStatus {
  Success = 1,
  Fail = 2,
}

export enum NetworkStatus {
  "연결됨" = 1,
  "연결이 끊김" = 2,
}

export enum EdgeSystemConnection {
  Connected = "연결됨",
  Disconnected = "연결이 끊김",
  Unknown = "Unknown"
}

export enum DrivingNegotiationsClass {
  'C (주행합의)' = 3,
  'D (지시적 협력)' = 4,
}

export enum CommunicationMethod {
  Broadcast = 0,
  Unicast = 1,
}

export enum MessageType {
  BSM = 0,
  DMM = 1,
}

export enum NodeType {
  합류로 = 0,
  직선로 = 1,
  교차로 = 2,
}