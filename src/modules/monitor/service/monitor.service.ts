import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommunicationEvents } from 'src/modules/events/entity/communication-events.entity';
import { EventsService } from 'src/modules/events/service/events.service';
import { NodeService } from 'src/modules/nodes/service/nodes.service';
import { Repository } from 'typeorm';
import { enumToKeyValue } from '@util/handleEnumValue';
import { EdgeSystemConnection, EventStatus, NetworkStatus } from 'src/constants';
import { Cron } from '@nestjs/schedule';
import { AvailabilityEvents } from 'src/modules/events/entity/availability-events.entity';
import { now } from 'moment';
import { getUnixCurrentTime, randomChoice, randomNumber } from '@util/function';

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
  ) {
    this.autoRefresh = true;
    this.isCronJobEnabled = false;
    this.countDisconnect = 0;
    this.isEdgeConnected = EdgeSystemConnection.Unknown;
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

    const messageType = await this.commEventsRepo
      .createQueryBuilder('comm_event')
      .select('comm_event.message_type')
      .distinct(true)
      .getRawMany();

    return {
      nodeList: nodeMap,
      eventStatus: enumToKeyValue(EventStatus),
      drivingNegotiationsClass: convertJsonArrayToObject(
        cooperationClass,
        'cooperation_class',
      ),
      messageType: convertJsonArrayToObject(messageType, 'message_type'),
    };
  }

  setStatusKeepAlive(status: string) {
    this.isEdgeConnected = status;
    return this.isEdgeConnected;
  }

  getStatusKeepAlive() {
    return {
      status: this.isEdgeConnected,
      count: this.countDisconnect
    }
  }

  setCountDisconnect(count: number) {
    this.countDisconnect = count;
    return this.countDisconnect;
  }

  getCountDisconnect() {
    return this.countDisconnect;
  }

  @Cron('* * * * * *')
  async keepAliveWithEdgeSystem() {
    if (this.countDisconnect > 60 && this.countDisconnect <= 180) {
      this.isEdgeConnected = EdgeSystemConnection.Unknown;
    } else if (this.countDisconnect > 180) {
      this.isEdgeConnected = EdgeSystemConnection.Disconnected;
    }
    this.countDisconnect += 1;
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

  // @Cron('0 */1 * * * *')
  // async cronjobGenAvailabilityEvents() {
  //   if (!this.isCronJobEnabled) {
  //     return; // If the cron job is disabled, exit the function immediately
  //   }
  //   const events = await this.genAvailEvents();
  //   return this.availEventsRepo.save(events);
  // }

  // @Cron('0 */1 * * * *')
  // async cronjobGenCommunicationEvents() {
  //   if (!this.isCronJobEnabled) {
  //     return; // If the cron job is disabled, exit the function immediately
  //   }
  //   const events = await this.genCommEvents();
  //   return this.commEventsRepo.save(events);
  // }
}

const convertJsonArrayToObject = (jsonArray: any[], key: string) => {
  const jsonObject: { [key: string]: string } = {};

  for (const item of jsonArray) {
    const value = item[key];
    jsonObject[value] = value;
  }

  return jsonObject;
};
