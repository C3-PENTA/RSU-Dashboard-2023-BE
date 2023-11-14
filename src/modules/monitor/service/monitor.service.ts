import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommunicationEvents } from 'src/modules/events/entity/communication-events.entity';
import { EventsService } from 'src/modules/events/service/events.service';
import { NodeService } from 'src/modules/nodes/service/nodes.service';
import { Repository } from 'typeorm';
import { enumToKeyValue } from '@util/handleEnumValue';
import {
  EventStatus,
  NetworkStatus,
} from 'src/constants';
import { Cron } from '@nestjs/schedule';
import { AvailabilityEvents } from 'src/modules/events/entity/availability-events.entity';
import { now } from 'moment';
import { getUnixCurrentTime, randomChoice, randomNumber } from '@util/function';
import {
  IAvailEvent,
  ICommEventList,
  IKeepAliveMessage,
} from '@interface/event.interface';
import { GatewayService } from 'src/modules/gateway/service/gateway.service';

interface RangeInf {
  min: number;
  max: number;
}

interface NodeProp {
  nodeID: string;
  rsuName: string;
  latitude?: number;
  longitude?: number;
}

interface AvailEventPropGenInf {
  nodes: NodeProp[];
  cpuUsage: RangeInf;
  cpuTemperature: RangeInf;
  ramUsage: RangeInf;
  diskUsage: RangeInf;
  networkSpeed: RangeInf;
  networkUsage: RangeInf;
}

interface CommEventPropGenInf {
  nodes: NodeProp[];
  cooperationClass: string[];
  sessionID: RangeInf;
  messageType: string[];
}

@Injectable()
export class MonitorService {
  private autoRefresh: boolean;
  public isCronJobEnabled: boolean;
  public isEdgeConnected: string;
  private countDisconnect: number;
  // private AvailEventProp: AvailEventPropGenInf;
  // private CommEventProp: CommEventPropGenInf;

  constructor(
    @InjectRepository(CommunicationEvents)
    private commEventsRepo: Repository<CommunicationEvents>,
    @InjectRepository(AvailabilityEvents)
    private availEventsRepo: Repository<AvailabilityEvents>,
    private nodeService: NodeService,
    private eventService: EventsService,
    private gatewayService: GatewayService,
  ) {
    this.autoRefresh = true;
    this.isCronJobEnabled = false;
  }

  setAutoRefresh(state: boolean): void {
    this.autoRefresh = state;
  }

  getAutoRefresh(): boolean {
    return this.autoRefresh;
  }

  async getMetadata() {
    const nodeList = await this.nodeService.findAll();
    const nodeMap = {};
    for (const node of nodeList.nodes) {
      nodeMap[node.rsuID] = node.id;
    }

    const cooperationClass = await this.commEventsRepo
      .createQueryBuilder('comm_event')
      .select('comm_event.cooperation_class')
      .distinct(true)
      .getRawMany();
    
    const sessionID = await this.commEventsRepo
      .createQueryBuilder('comm_event')
      .select('comm_event.session_id')
      .distinct(true)
      .getRawMany();
    
    const communicationClass = await this.commEventsRepo
      .createQueryBuilder('comm_event')
      .select('comm_event.communication_class')
      .distinct(true)
      .getRawMany();

    const messageType = await this.commEventsRepo
      .createQueryBuilder('comm_event')
      .select('comm_event.message_type')
      .distinct(true)
      .getRawMany();
    
    const communicationMethod = await this.commEventsRepo
      .createQueryBuilder('comm_event')
      .select('comm_event.method')
      .distinct(true)
      .getRawMany();


    return {
      nodeList: nodeMap,
      eventStatus: enumToKeyValue(EventStatus),
      cooperationClass: convertJsonArrayToObject(
        cooperationClass,
        'cooperation_class',
      ),
      sessionID: convertJsonArrayToObject(sessionID, 'session_id'),
      communicationClass: convertJsonArrayToObject(communicationClass,'communication_class'),
      communicationMethod: convertJsonArrayToObject(communicationMethod, 'comm_event_method'),
      messageType: convertJsonArrayToObject(messageType, 'message_type'),
    };
  }

  async getEdgeStatus(data: IAvailEvent) {
    const event = await this.eventService.parseDataToAvailEvent(data);
    const result = await this.eventService.saveEvent(1, event);
    if (result.status == 2) {
      const notification = { nodeID: data.nodeID, detail: event.detail };
      this.gatewayService.server.emit('notification', notification);
    }
  }

  async getEdgeMessageList(data: ICommEventList) {
    const events = await this.eventService.parseDataToCommEvent(data);
    const result = await this.eventService.saveEvent(2, events);
  }

  getEdgeKeepAlive(data: IKeepAliveMessage) {
    return this.eventService.parseDataToKeepAlive(data);
  }

  getDoorStatus(data: { doorStatus: string }) {
    return this.eventService.parseDataToDoorStatus(data);
  }

  // changeAvailEventProp(prop: AvailEventPropGenInf) {
  //   this.AvailEventProp = prop;
  // }

  // changeCommEventProp(prop: CommEventPropGenInf) {
  //   this.CommEventProp = prop;
  // }

  // async genAvailEvents() {
  //   if (!this.AvailEventProp) {
  //     return;
  //   }

  //   const nodes = this.AvailEventProp.nodes;
  //   const eventList = nodes.map((node) => ({
  //     timeStamp: getUnixCurrentTime(),
  //     nodeID: node.nodeID,
  //     rsuName: node.rsuName,
  //     cpuUsage: randomNumber(
  //       this.AvailEventProp.cpuUsage.min,
  //       this.AvailEventProp.cpuUsage.max,
  //     ),
  //     cpuTemperature: randomNumber(
  //       this.AvailEventProp.cpuTemperature.min,
  //       this.AvailEventProp.cpuTemperature.max,
  //     ),
  //     ramUsage: randomNumber(
  //       this.AvailEventProp.ramUsage.min,
  //       this.AvailEventProp.ramUsage.max,
  //     ),
  //     diskUsage: randomNumber(
  //       this.AvailEventProp.diskUsage.min,
  //       this.AvailEventProp.diskUsage.max,
  //     ),
  //     rsuConnection: true,
  //     networkSpeed: randomNumber(
  //       this.AvailEventProp.networkSpeed.min,
  //       this.AvailEventProp.networkSpeed.max,
  //     ),
  //     networkUsage: randomNumber(
  //       this.AvailEventProp.networkUsage.min,
  //       this.AvailEventProp.networkUsage.max,
  //     ),
  //     latitude: node.latitude,
  //     longitude: node.longitude,
  //   }));
  //   return eventList;
  // }

  // async genCommEvents() {
  //   if (!this.CommEventProp) {
  //     return;
  //   }

  //   const eventList = [];
  //   const nodes = this.CommEventProp.nodes;
  //   const communicationType = randomChoice(['broadcasting', 'unicasting']);
  //   if (communicationType === 'broadcasting') {
  //     const node = randomChoice(nodes);
  //     eventList.push({
  //       communicationClass: 'send',
  //       timeStamp: getUnixCurrentTime(),
  //       nodeID: node.nodeID,
  //       rsuName: node.rsuName,
  //       cooperationClass: randomChoice(this.CommEventProp.cooperationClass),
  //       sessionID: randomNumber(
  //         this.CommEventProp.sessionID.min,
  //         this.CommEventProp.sessionID.max,
  //       ),
  //       communicationType: communicationType,
  //       senderNodeID: node.nodeID,
  //       receiverNodeID: 'B',
  //       messageType: randomChoice(this.CommEventProp.messageType),
  //       messageData: '000000101010101001',
  //     });
  //   } else {
  //     const senderNode = randomChoice(nodes);
  //     const receiverNode = randomChoice([
  //       ...nodes.filter((item) => item !== senderNode),
  //     ]);

  //     const sendEvent = {
  //       communicationClass: 'send',
  //       timeStamp: getUnixCurrentTime(),
  //       nodeID: senderNode.nodeID,
  //       rsuName: senderNode.rsuName,
  //       cooperationClass: randomChoice(this.CommEventProp.cooperationClass),
  //       sessionID: randomNumber(
  //         this.CommEventProp.sessionID.min,
  //         this.CommEventProp.sessionID.max,
  //       ),
  //       communicationType: communicationType,
  //       senderNodeID: senderNode.nodeID,
  //       receiverNodeID: receiverNode.nodeID,
  //       messageType: randomChoice(this.CommEventProp.messageType),
  //       messageData: '000000101010101001',
  //     };

  //     const receiveEvent = {
  //       communicationClass: 'receive',
  //       timeStamp: getUnixCurrentTime(),
  //       nodeID: receiverNode.nodeID,
  //       rsuName: receiverNode.rsuName,
  //       cooperationClass: null,
  //       sessionID: null,
  //       communicationType: communicationType,
  //       senderNodeID: senderNode.nodeID,
  //       receiverNodeID: receiverNode.nodeID,
  //       messageType: randomChoice(this.CommEventProp.messageType),
  //       messageData: '000000101010101001',
  //     };

  //     eventList.push([sendEvent, receiveEvent]);
  //   }
  //   return eventList;
  // }
}

const convertJsonArrayToObject = (jsonArray: any[], key: string) => {
  const jsonObject: { [key: string]: string } = {};

  for (const item of jsonArray) {
    const value = item[key];
    if (value) jsonObject[value] = value;
  }

  return jsonObject;
};
