import { Injectable } from '@nestjs/common';
import { CommunicationMethod, DrivingNegotiationsClass, EventStatus, MessageType, NetworkStatus, NodeType } from 'src/constants';
import { NodeService } from 'src/modules/nodes/service/nodes.service';
import { enumToKeyValue } from 'src/util/handleEnumValue';

@Injectable()
export class MonitorService {
  private autoRefresh: boolean;
  constructor( private nodeService: NodeService) { this.autoRefresh = true }

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
      nodeMap[node.custom_id] = node.id;
    }
    const drivingNegotiationsClass = enumToKeyValue(DrivingNegotiationsClass);
    const networkStatus = enumToKeyValue(NetworkStatus);
    const eventStatus = enumToKeyValue(EventStatus); // Assuming you have an enum EventStatus, if not, you can remove this line
    const communicationMethod = enumToKeyValue(CommunicationMethod);
    const messageType = enumToKeyValue(MessageType);
    const nodeType = enumToKeyValue(NodeType);
  
    return {
      nodeList: nodeMap,
      eventStatus: eventStatus,
      drivingNegotiationsClass: drivingNegotiationsClass,
      networkStatus: networkStatus,
      communicationMethod: communicationMethod,
      messageType: messageType,
      nodeType: nodeType,
    };
  }
  
}