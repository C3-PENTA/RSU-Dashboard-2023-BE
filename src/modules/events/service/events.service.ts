import { Injectable, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';
import { CommunicationEvents } from '../entity/communication-events.entity';
import { AvailabilityEvents } from '../entity/availability-events.entity';
import { Nodes } from 'src/modules/nodes/entity/nodes.entity';
import {
  CommunicationMethod,
  DrivingNegotiationsClass,
  MessageType,
  NetworkStatus,
  NodeType,
  Event_Key,
} from 'src/constants';
import { mergeResults } from 'src/util/mergeResultsEventSummary';
import { Cron } from '@nestjs/schedule';
import { NodeService } from 'src/modules/nodes/service/nodes.service';
import { isValidHeader } from 'src/util/isValidFileImport';
import { convertTimeZone, convertToUTC } from 'src/util/convertTimeZone';
import { getEnumValue } from 'src/util/handleEnumValue';
import * as moment from 'moment-timezone';
import { Response } from 'express';
import { randomChoice, randomNumber } from 'src/util/randomNumber';
import * as fs from 'fs-extra';
import * as fastcsv from 'fast-csv';
import { exportDataToZip } from 'src/util/exportData';
import { IgnoreEventsService } from 'src/modules/users/service/ignore-events.service';

@Injectable()
export class EventsService {
  public isCronJobEnabled = process.env.APP_ENV == 'PROD' ? true : false;
  constructor(
    @InjectRepository(CommunicationEvents)
    private communicationEventsRepository: Repository<CommunicationEvents>,
    @InjectRepository(AvailabilityEvents)
    private availabilityEventsRepository: Repository<AvailabilityEvents>,
    private nodeService: NodeService,
    private ignoreEventsService: IgnoreEventsService
  ) { }

  async saveEvent(type: number, events: any) {
    try {
      if (type === 1) {
        await this.availabilityEventsRepository.save(events);
      } else if (type === 2) {
        await this.communicationEventsRepository.save(events);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async deleteEvent(type: number, eventIds: string[], deleteAll: boolean) {
    try {
      let result;
      if (type == 1) {
        if (deleteAll == true) {
          result = await this.availabilityEventsRepository.delete({});
        } else {
          result = await this.availabilityEventsRepository.delete({
            id: In(eventIds),
          });
        }
      } else if (type == 2) {
        if (deleteAll == true) {
          result = await this.communicationEventsRepository.delete({});
        } else {
          result = await this.communicationEventsRepository.delete({
            id: In(eventIds),
          });
        }
      } else {
        return { message: 'Invalid type' };
      }
      return { message: `${result.affected} events deleted successfully` };
    } catch (err) {
      return { message: 'Error' };
    }
  }

  async checkDuplicateRow(event: CommunicationEvents) {
    const duplicateEvent = await this.communicationEventsRepository.findOne({
      where: {
        node_id: event.node_id,
        driving_negotiations_class: event.driving_negotiations_class,
        method: event.method,
        src_node: event.src_node,
        dest_node: event.dest_node,
        message_type: event.message_type,
        created_at: event.created_at,
      },
    });
    if (duplicateEvent) return true;
    else return false;
  }

  async getEventsList(
    type: number,
    startDate: Date,
    endDate: Date,
    nodeId: string[],
    status: number,
    drivingNegotiationClass: number[],
    messageType: number[],
    limit: number,
    page: number,
    sortBy: string,
    sortOrder: string,
  ) {
    let queryBuilder;
    const now = new Date();
    if (type == 1) {
      queryBuilder = this.availabilityEventsRepository
        .createQueryBuilder('events')
        .select([
          'events.id as id',
          'nodes.custom_id as "nodeId"',
          'nodes.type as "nodeType"',
          'events.cpu_usage as "cpuUsage"',
          'events.cpu_temp as "cpuTemp"',
          'events.ram_usage as "ramUsage"',
          'events.disk_usage as "diskUsage"',
          'events.network_speed as "networkSpeed"',
          'events.network_usage as "networkUsage"',
          'events.network_status as "networkStatus"',
          'events.created_at as "createdAt"',
          'events.detail as "detail"',
        ]);
    } else if (type == 2) {
      queryBuilder = this.communicationEventsRepository
        .createQueryBuilder('events')
        .select([
          'events.id as id',
          'nodes.custom_id as "nodeId"',
          'nodes.type as "nodeType"',
          'src_node.custom_id as "srcNode"',
          'dest_node.custom_id as "destNode"',
          'events.driving_negotiations_class as "drivingNegotiationsClass"',
          'events.method as method',
          'events.message_type as "messageType"',
          'events.created_at as "createdAt"',
          'events.detail as "detail"',
        ])
        .leftJoin(Nodes, 'src_node', 'events.src_node = src_node.id')
        .leftJoin(Nodes, 'dest_node', 'events.dest_node = dest_node.id');

      queryBuilder = queryBuilder
        .andWhere(
          drivingNegotiationClass && drivingNegotiationClass.length
            ? 'events.driving_negotiations_class IN (:...drivingNegotiationClass)'
            : '1=1',
          { drivingNegotiationClass },
        )
        .andWhere(
          messageType && messageType.length
            ? 'events.message_type IN(:...messageType)'
            : '1=1',
          { messageType },
        );
    }

    queryBuilder = queryBuilder
      .innerJoin(Nodes, 'nodes', 'events.node_id = nodes.id')
      .andWhere('events.created_at <= :now', { now })
      .andWhere(startDate ? 'events.created_at >= :startDate' : '1=1', {
        startDate,
      })
      .andWhere(endDate ? 'events.created_at < :endDate' : '1=1', {
        endDate,
      })
      .andWhere(
        nodeId && nodeId.length ? 'events.node_id IN (:...nodeIds)' : '1=1',
        { nodeIds: nodeId },
      )
      .andWhere(status ? 'events.status = :status' : '1=1', { status })
      .orderBy('events.created_at', 'DESC');

    if (sortBy && sortOrder) {
      queryBuilder.orderBy(
        `events.${sortBy}`,
        sortOrder.toUpperCase() as 'ASC' | 'DESC',
      );
    } else {
      queryBuilder.orderBy('events.created_at', 'DESC');
    }

    const events = await queryBuilder
      .limit(limit)
      .offset(page === 1 ? 0 : (page - 1) * limit)
      .getRawMany();

    let mapEvents;
    if (type == 1) {
      mapEvents = events.map((event) => {
        event.networkSpeed = event.networkSpeed ?? '-';
        if (event.networkSpeed != '-') event.networkSpeed += ' Mbps';

        event.networkUsage = event.networkUsage ?? '-';
        if (event.networkUsage != '-') event.networkUsage += ' Byte';

        return {
          id: event.id,
          nodeId: event.nodeId,
          nodeType: NodeType[event.nodeType],
          detail: event.detail,
          status: event.status,
          createdAt: event.createdAt,
          cpuUsage: event.cpuUsage,
          cpuTemp: event.cpuTemp,
          ramUsage: event.ramUsage,
          diskUsage: event.diskUsage,
          networkSpeed: event.networkSpeed,
          networkUsage: event.networkUsage,
          networkStatus: NetworkStatus[event.networkStatus],
        };
      });
    } else if (type == 2) {
      mapEvents = events.map((event) => {
        return {
          id: event.id,
          nodeId: event.nodeId,
          nodeType: NodeType[event.nodeType],
          srcNode: event.srcNode ? event.srcNode : 'B',
          destNode: event.destNode ? event.destNode : 'B',
          drivingNegotiationsClass:
            DrivingNegotiationsClass[event.drivingNegotiationsClass],
          method: CommunicationMethod[event.method],
          messageType: MessageType[event.messageType],
          detail: event.detail,
          status: event.status,
          createdAt: event.createdAt,
        };
      });
    }

    const total = await queryBuilder.getCount();

    const totalPages = limit ? Math.ceil(total / limit) : 1;

    return {
      events: mapEvents,
      meta: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: total,
        perPage: limit,
      },
    };
  }


  async getEventsSummary(time_range: string) {
    const availabilityNormal = this.availabilityEventsRepository
      .createQueryBuilder('avai_events')
      .select([
        'node_id as "nodeId"',
        'nodes.custom_id as "customId"',
        'COUNT(node_id) as "totalAvailabilityNormal"',
      ])
      .innerJoin(Nodes, 'nodes', 'avai_events.node_id = nodes.id')
      .where('avai_events.status = 1')
      .groupBy('avai_events.node_id, nodes.custom_id');

    const communicationNormal = this.communicationEventsRepository
      .createQueryBuilder('comm_events')
      .select([
        'node_id as "nodeId"',
        'nodes.custom_id as "customId"',
        'COUNT(node_id) as "totalCommunicationNormal"',
      ])
      .innerJoin(Nodes, 'nodes', 'comm_events.node_id = nodes.id')
      .where('comm_events.status = 1')
      .groupBy('comm_events.node_id, nodes.custom_id');

    const availabilityError = this.availabilityEventsRepository
      .createQueryBuilder('avai_events')
      .select([
        'node_id as "nodeId"',
        'nodes.custom_id as "customId"',
        'COUNT(node_id) as "totalAvailabilityError"',
      ])
      .innerJoin(Nodes, 'nodes', 'avai_events.node_id = nodes.id')
      .where('avai_events.status = 2')
      .groupBy('avai_events.node_id, nodes.custom_id');

    const communicationError = this.communicationEventsRepository
      .createQueryBuilder('comm_events')
      .select([
        'node_id as "nodeId"',
        'nodes.custom_id as "customId"',
        'COUNT(node_id) as "totalCommunicationError"',
      ])
      .innerJoin(Nodes, 'nodes', 'comm_events.node_id = nodes.id')
      .where('comm_events.status = 2')
      .groupBy('comm_events.node_id, nodes.custom_id');

    const hourAgo = new Date(new Date().getTime() - 60 * 60 * 1000);

    let summary: any[] = [];

    if (time_range === 'all') {
      const [
        availabilityNormalEvents,
        availabilityErrorEvents,
        communicationNormalEvents,
        communicationErrorEvents,
      ] = await Promise.all([
        availabilityNormal.getRawMany(),
        availabilityError.getRawMany(),
        communicationNormal.getRawMany(),
        communicationError.getRawMany(),
      ]);

      const mergedResults = mergeResults(
        availabilityNormalEvents,
        availabilityErrorEvents,
        communicationNormalEvents,
        communicationErrorEvents,
      );
      summary = Array.from(mergedResults.values());
    } else if (time_range === 'hour_ago') {
      const [
        availabilityNormalEvents,
        availabilityErrorEvents,
        communicationNormalEvents,
        communicationErrorEvents,
      ] = await Promise.all([
        availabilityNormal
          .andWhere('avai_events.created_at > :timestamp', { timestamp: hourAgo })
          .getRawMany(),
        availabilityError
          .andWhere('avai_events.created_at > :timestamp', { timestamp: hourAgo })
          .getRawMany(),
        communicationNormal
          .andWhere('comm_events.created_at > :timestamp', { timestamp: hourAgo })
          .getRawMany(),
        communicationError
          .andWhere('comm_events.created_at > :timestamp', { timestamp: hourAgo })
          .getRawMany(),
      ]);

      const mergedResults = mergeResults(
        availabilityNormalEvents,
        availabilityErrorEvents,
        communicationNormalEvents,
        communicationErrorEvents,
      );
      summary = Array.from(mergedResults.values());
    }

    return { summary };
  }

  async getLatestAvailabilityEvents() {
    const query = `
      WITH latest_event AS (
        SELECT
          e.id,
          NOW() as now,
          ROW_NUMBER() OVER (
            PARTITION BY e.node_id
            ORDER BY e.created_at DESC
          ) AS row_number
        FROM public.availability_events AS e
        WHERE e.created_at BETWEEN NOW() - INTERVAL '2 minutes' AND NOW()
      )
      
      SELECT
        le.id,
        nodes.custom_id,
        nodes.type,
        e.cpu_usage,
        e.cpu_temp,
        e.ram_usage,
        e.disk_usage,
        e.network_speed,
        e.network_usage,
        e.network_status,
        e.created_at,
        le.now
      FROM latest_event as le
      JOIN public.availability_events AS e ON le.id = e.id
      JOIN public.nodes as nodes ON e.node_id = nodes.id
      WHERE le.row_number = 1
      ORDER BY nodes.custom_id
    `;

    const result = await this.availabilityEventsRepository.query(query);
    return result.map((ele) => {
      ele.network_speed = ele.network_speed ?? '-';
      if (ele.network_speed != '-') ele.network_speed += ' Mbps';

      ele.network_usage = ele.network_usage ?? '-';
      if (ele.network_usage != '-') ele.network_usage += ' Byte';

      return {
        eventId: ele.id,
        nodeId: ele.custom_id,
        nodeType: NodeType[ele.type],
        cpuUsage: ele.cpu_usage,
        cpuTemp: ele.cpu_temp,
        ramUsage: ele.ram_usage,
        diskUsage: ele.disk_usage,
        networkSpeed: ele.network_speed,
        networkUsage: ele.network_usage,
        networkStatus: NetworkStatus[ele.network_status],
        createdAt: ele.created_at,
        now: ele.now,
      };
    });
  }

  async getNewEvents() {
    const lastUpdated = new Date();
    const now = new Date();
    lastUpdated.setMinutes(lastUpdated.getMinutes() - 1);

    const avaiEvents = await this.availabilityEventsRepository
      .createQueryBuilder('events')
      .select([
        'events.id as id',
        'nodes.custom_id as "nodeId"',
        'events.detail as detail',
      ])
      .innerJoin(Nodes, 'nodes', 'events.node_id = nodes.id')
      .where('events.created_at > :lastUpdated AND events.created_at <= :now', {
        lastUpdated,
        now,
      })
      .andWhere('events.status = 2')
      .getRawMany();

    const commEvents = await this.communicationEventsRepository
      .createQueryBuilder('events')
      .select([
        'events.id as id',
        'nodes.custom_id as "nodeId"',
        'events.detail as detail',
      ])
      .innerJoin(Nodes, 'nodes', 'events.node_id = nodes.id')
      .where('events.created_at > :lastUpdated AND events.created_at <= :now', {
        lastUpdated,
        now,
      })
      .andWhere('events.status = 2')
      .getRawMany();

    const result = [...avaiEvents, ...commEvents];

    return result.map((event) => {
      return {
        id: event.id,
        nodeId: event.nodeId,
        detail: event.detail,
        status: event.status,
      };
    });
  }


  async exportDataToCsv(type: number, eventIds: string[]) {
    try {
      if (type == 1) {
        const result = await this.availabilityEventsRepository
          .createQueryBuilder('events')
          .select([
            'nodes.custom_id as "nodeId"',
            'nodes.type as "nodeType"',
            'events.cpu_usage as "cpuUsage"',
            'events.cpu_temp as "cpuTemp"',
            'events.ram_usage as "ramUsage"',
            'events.disk_usage as "diskUsage"',
            'events.network_speed as "networkSpeed"',
            'events.network_usage as "networkUsage"',
            'events.network_status as "networkStatus"',
            'events.created_at as "createdAt"',
            'events.detail as detail',
          ])
          .innerJoin(Nodes, 'nodes', 'events.node_id = nodes.id')
          .where({ id: In(eventIds) })
          .getRawMany();

        return result.map((event) => {
          return {
            [Event_Key.OCCURRENCE_TIME]: convertTimeZone(event.createdAt),
            [Event_Key.NODE_ID]: event.nodeId,
            [Event_Key.NODE_TYPE]: NodeType[event.nodeType],
            [Event_Key.CPU_USAGE]: event.cpuUsage,
            [Event_Key.CPU_TEMPERATURE]: event.cpuTemp,
            [Event_Key.RAM_USAGE]: event.ramUsage,
            [Event_Key.DISK_USAGE]: event.diskUsage,
            [Event_Key.NETWORK_SPEED]: event.networkSpeed + ' Mbps',
            [Event_Key.NETWORK_USAGE]: event.networkUsage + ' Byte',
            [Event_Key.NETWORK_CONNECTION_STATUS]:
              NetworkStatus[event.networkStatus],
            [Event_Key.DETAIL]: event.detail,
          };
        });
      } else if (type == 2) {
        const result = await this.communicationEventsRepository
          .createQueryBuilder('events')
          .select([
            'events.id as id',
            'nodes.custom_id as "nodeId"',
            'nodes.type as "nodeType"',
            'src_node.custom_id as "srcNode"',
            'dest_node.custom_id as "destNode"',
            'events.driving_negotiations_class as "drivingNegotiationsClass"',
            'events.method as method',
            'events.message_type as "messageType"',
            'events.status as status',
            'events.created_at as "createdAt"',
            'events.detail as detail',
          ])
          .innerJoin(Nodes, 'nodes', 'events.node_id = nodes.id')
          .innerJoin(Nodes, 'src_node', 'events.src_node = src_node.id')
          .innerJoin(Nodes, 'dest_node', 'events.dest_node = dest_node.id')
          .where({ id: In(eventIds) })
          .getRawMany();

        return result.map((event) => {
          return {
            [Event_Key.OCCURRENCE_TIME]: convertTimeZone(event.createdAt),
            [Event_Key.NODE_ID]: event.nodeId,
            [Event_Key.NODE_TYPE]: NodeType[event.nodeType],
            [Event_Key.SRC_NODE]: event.srcNode,
            [Event_Key.DEST_NODE]: event.destNode,
            [Event_Key.DRIVING_NEGOTIATION_CLASS]:
              DrivingNegotiationsClass[event.drivingNegotiationsClass],
            [Event_Key.METHOD]: CommunicationMethod[event.method],
            [Event_Key.MESSAGE_TYPE]: MessageType[event.messageType],
            [Event_Key.DETAIL]: event.detail,
          };
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async saveBatch(
    records: any,
    typeEvent: number,
    nodeMap: any,
    offset: number,
    errorRecords: any,
  ) {
    const { validEvents, inValidEvents } = await this.validateEvent(
      records,
      typeEvent,
      {
        nodeInfo: nodeMap,
        offset,
      },
    );

    errorRecords.push(...inValidEvents);

    await this.saveEvent(typeEvent, validEvents);

    offset += records.length;
    return {
      errorRecords: errorRecords,
      offset: offset,
    };
  }

  async defineErrorMessage(type: number, event: any) {
    const details = [];
    if (type == 1) {
      if (+event.cpuTemp > 70 || event.cpu_temp > 70) {
        details.push('높은 CPU 온도');
      }

      if (+event.cpuUsage > 70 || event.cpu_usage > 70) {
        details.push('높은 CPU 사용량');
      }

      if (+event.ramUsage > 80 || event.ram_usage > 80) {
        details.push('높은 RAM 사용량');
      }

      if (+event.diskUsage > 80 || event.disk_usage > 80) {
        details.push('높은 DISK 사용량');
      }

      if (+event.networkStatus == 2 || event.network_status == 2) {
        details.push('네트워크 오류');
      }
    } else if (type == 2) {
      let isDuplicated = await this.checkDuplicateRow(event);
      if (isDuplicated == true) {
        details.push('중복 메시지 수신');
      }
    }

    let detailMessage = '';
    if (details.length != 0) {
      if (details.length === 1) {
        detailMessage += `${details[0]}`;
      } else if (details.length === 2) {
        detailMessage += `${details[0]} & ${details[1]}`;
      } else {
        const lastDetail = details.pop();
        detailMessage += `${details.join(', ')} & ${lastDetail}`;
      }
    }
    return detailMessage;
  }

  async generateData(
    @Res() res: Response,
    typeEvent: number,
    start: string,
    end: string,
  ) {
    const dateFormat = 'YYYY-MM-DD HH:mm:ssZ';

    const startDate = moment.tz(start, dateFormat).toDate();
    const endDate = moment.tz(end, dateFormat).toDate();

    // Create a Map to index the nodes by custom_id
    const nodeList = await this.nodeService.findAll();
    const nodeMap = new Map();
    for (const node of nodeList.nodes) {
      nodeMap.set(node.id, node);
    }

    try {
      let current = new Date(startDate); // Start from startDate
      const totalEvents = [];

      while (current <= endDate) {
        if (typeEvent == 1) {
          const events = await this.genAvailEvents(current);
          totalEvents.push(...events);
        } else if (typeEvent == 2) {
          const events = await this.genCommEvents(current);
          totalEvents.push(...events);
        }
        // Move to the next minute
        current = new Date(current.getTime() + 60 * 1000); // Add 1 minute
      }

      let mappedArray;
      if (typeEvent == 1) {
        mappedArray = totalEvents.map((event) => ({
          '발생 시간': convertTimeZone(event.created_at),
          '노드 ID': nodeMap.get(event.node_id).custom_id,
          'CPU 사용량': event.cpu_usage,
          'CPU 온도': event.cpu_temp,
          'RAM 사용량': event.ram_usage,
          'DISK 사용량': event.disk_usage,
          '네트워크 속도': event.network_speed,
          '네트워크 사용량': event.network_usage,
          '네트워크 연결 상태': NetworkStatus[event.network_status],
        }));
      } else {
        mappedArray = totalEvents.map((event) => ({
          '발생 시간': convertTimeZone(event.created_at),
          '노드 ID': nodeMap.get(event.node_id).custom_id,
          '송신 노드': event.src_node
            ? nodeMap.get(event.src_node).custom_id
            : 'B',
          '수신 노드': event.dest_node
            ? nodeMap.get(event.dest_node).custom_id
            : 'B',
          '주행협상 클래스':
            DrivingNegotiationsClass[event.driving_negotiations_class],
          '통신 방법': CommunicationMethod[event.method],
          '메시지 종류': MessageType[event.message_type],
        }));
      }

      return exportDataToZip(res, mappedArray);
    } catch (err) {
      console.error(err);
    }
  }

  async genCommEvents(timestamp: Date = new Date()) {
    const idList = [...(await this.nodeService.getMapNodeList()).idMap.keys()];
    idList.push('');

    // variable to double result
    const isSame = randomChoice([0, 1]);

    const eventA = new CommunicationEvents();
    eventA.node_id = randomChoice(idList.filter((item) => item !== ''));
    eventA.driving_negotiations_class = randomChoice([3, 4]);
    eventA.created_at = timestamp;

    const temp_node = randomChoice([
      ...idList.filter((item) => item !== eventA.node_id),
    ]);

    if (temp_node == '') {
      eventA.method = 0;
      const randomVal = randomChoice([0, 1]);
      if (randomVal == 0) {
        eventA.dest_node = eventA.node_id;
        eventA.message_type = 1;
      } else {
        eventA.src_node = eventA.node_id;
        eventA.message_type = 0;
      }
      const result = [eventA];
      if (isSame == 1) {
        const dupResult = JSON.parse(JSON.stringify(result));
        dupResult.forEach((event) => {
          event.status = 2;
          event.detail = '중복 메시지 수신';
        });

        result.forEach((event) => {
          event.status = 1;
        });
        return [...result, ...dupResult];
      } else {
        result.forEach((event) => {
          event.status = 1;
        });
        return result;
      }
    } else {
      eventA.dest_node = temp_node;
      eventA.src_node = eventA.node_id;
      eventA.message_type = 0;
      eventA.method = 1;

      const eventB = {
        ...eventA,
        node_id: eventA.dest_node,
      };

      const result = [eventA, eventB];
      if (isSame == 1) {
        const dupResult = JSON.parse(JSON.stringify(result));
        dupResult.forEach((event) => {
          event.status = 2;
          event.detail = '중복 메시지 수신';
        });
        result.forEach((event) => {
          event.status = 1;
        });
        return [...result, ...dupResult];
      } else {
        result.forEach((event) => {
          event.status = 1;
        });
        return result;
      }
    }
  }

  async genAvailEvents(timestamp: Date = new Date()) {
    const idList = [...(await this.nodeService.getMapNodeList()).idMap.keys()];
    const events = [];

    for (const nodeId of idList) {
      let event = new AvailabilityEvents();
      event.node_id = nodeId;
      event.created_at = timestamp;
      event.cpu_usage = randomNumber(0, 100);
      event.cpu_temp = randomNumber(0, 100);
      event.ram_usage = randomNumber(0, 100);
      event.disk_usage = randomNumber(0, 100);
      event.network_status = randomChoice([1, 2]);
      if (event.network_status == 1) {
        event.network_speed = randomNumber(0, 100);
        event.network_usage = randomNumber(0, 100);
      }
      event.detail = await this.defineErrorMessage(1, event);
      event.status = event.detail.length > 0 ? 2 : 1;
      events.push(event);
    }
    return events;
  }

  @Cron('0 */1 * * * *')
  async genAvailabilityEventsCron() {
    if (!this.isCronJobEnabled) {
      return; // If the cron job is disabled, exit the function immediately
    }
    const events = await this.genAvailEvents();
    return this.availabilityEventsRepository.save(events);
  }

  @Cron('0 */1 * * * *')
  async genCommunicationEvents() {
    if (!this.isCronJobEnabled) {
      return; // If the cron job is disabled, exit the function immediately
    }
    const events = await this.genCommEvents();
    return this.communicationEventsRepository.save(events);
  }

  async parseCsvAndSaveToDatabase(filePath: string) {
    try {
      const records: any[] = [];

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(fastcsv.parse({ headers: true }))
          .on('data', (row) => {
            records.push(row);
          })
          .on('end', () => {
            resolve(records);
          })
          .on('error', (error) => {
            reject(error);
          });
      });

      let batchRecords = [];
      const batchSize = 5000;
      let offset = 2;
      let errorRecords = [];
      let typeEvent = isValidHeader(records[0]);
      if (typeEvent == 0) throw new Error('Wrong file format');
      const nodeMap = (await this.nodeService.getMapNodeList()).customMap;

      for (const record of records) {
        batchRecords.push(record);
        if (batchRecords.length >= batchSize) {
          const batchResult = await this.saveBatch(
            batchRecords,
            typeEvent,
            nodeMap,
            offset,
            errorRecords,
          );
          errorRecords = batchResult.errorRecords;
          offset = batchResult.offset;
          batchRecords = [];
        }
      }

      if (batchRecords.length > 0) {
        const batchResult = await this.saveBatch(
          batchRecords,
          typeEvent,
          nodeMap,
          offset,
          errorRecords,
        );
        errorRecords = batchResult.errorRecords;
        offset = batchResult.offset;
      }

      if (errorRecords.length == records.length) throw new Error();
      let message = '';
      if (errorRecords.length != 0)
        message = ` file ${filePath.replace(
          /.*[\\/]/,
          '',
        )} at line ${errorRecords} `;
      return {
        status: 'success',
        message: message,
        errorRecords: errorRecords,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to import data! Wrong file format',
      };
    }
  }

  async mapInformationEvent(
    record: any,
    typeEvent: number,
    additionalInfo: any,
  ) {
    try {
      let event;
      if (typeEvent == 1) {
        const node = additionalInfo.nodeInfo.get(record[Event_Key.NODE_ID]);
        let cpuUsage = parseFloat(record[Event_Key.CPU_USAGE]);
        cpuUsage = cpuUsage < 0 || cpuUsage > 100 ? null : cpuUsage;

        let cpuTemp = parseFloat(record[Event_Key.CPU_TEMPERATURE]);
        cpuTemp = cpuTemp < 0 || cpuTemp > 100 ? null : cpuTemp;

        let ramUsage = parseFloat(record[Event_Key.RAM_USAGE]);
        ramUsage = ramUsage < 0 || ramUsage > 100 ? null : ramUsage;

        let diskUsage = parseFloat(record[Event_Key.DISK_USAGE]);
        diskUsage = diskUsage < 0 || diskUsage > 100 ? null : diskUsage;

        let networkStatus = getEnumValue(
          NetworkStatus,
          record[Event_Key.NETWORK_CONNECTION_STATUS],
        );

        let networkSpeed = parseFloat(record[Event_Key.NETWORK_SPEED]);
        networkSpeed =
          networkSpeed < 0 || networkSpeed > 100 ? null : networkSpeed;

        let networkUsage = parseFloat(record[Event_Key.NETWORK_USAGE]);
        networkUsage =
          networkUsage < 0 || networkUsage > 100 ? null : networkUsage;

        if (
          networkStatus == 2 &&
          (record[Event_Key.NETWORK_USAGE] != '' ||
            record[Event_Key.NETWORK_SPEED] != '')
        ) {
          throw new Error();
        }

        event = new AvailabilityEvents();
        event.node_id =
          node ??
          (() => {
            throw new Error();
          })();
        event.cpu_usage =
          cpuUsage ??
          (() => {
            throw new Error();
          })();
        event.cpu_temp =
          cpuTemp ??
          (() => {
            throw new Error();
          })();
        event.ram_usage =
          ramUsage ??
          (() => {
            throw new Error();
          })();
        event.disk_usage =
          diskUsage ??
          (() => {
            throw new Error();
          })();
        event.network_status =
          networkStatus ??
          (() => {
            throw new Error();
          })();
        event.network_speed =
          typeof networkSpeed !== 'undefined'
            ? Number.isNaN(networkSpeed)
              ? null
              : networkSpeed
            : (() => {
              throw new Error();
            })();
        event.network_usage =
          typeof networkUsage !== 'undefined'
            ? Number.isNaN(networkUsage)
              ? null
              : networkUsage
            : (() => {
              throw new Error();
            })();
        event.created_at = convertToUTC(record[Event_Key.OCCURRENCE_TIME]);
        event.detail = await this.defineErrorMessage(1, event);
        event.status = event.detail != '' ? 2 : 1;
      } else if (typeEvent == 2) {
        event = new CommunicationEvents();
        event.node_id =
          record[Event_Key.NODE_ID] != 'B'
            ? additionalInfo.nodeInfo.get(record[Event_Key.NODE_ID])
            : null;
        event.dest_node =
          record[Event_Key.DEST_NODE] != 'B'
            ? additionalInfo.nodeInfo.get(record[Event_Key.DEST_NODE])
            : null;
        event.src_node =
          record[Event_Key.SRC_NODE] != 'B'
            ? additionalInfo.nodeInfo.get(record[Event_Key.SRC_NODE])
            : null;

        event.driving_negotiations_class =
          getEnumValue(
            DrivingNegotiationsClass,
            record[Event_Key.DRIVING_NEGOTIATION_CLASS],
          ) ??
          (() => {
            throw new Error();
          })();
        event.method =
          getEnumValue(CommunicationMethod, record[Event_Key.METHOD]) ??
          (() => {
            throw new Error();
          })();
        event.message_type =
          getEnumValue(MessageType, record[Event_Key.MESSAGE_TYPE]) ??
          (() => {
            throw new Error();
          })();
        event.created_at = convertToUTC(record[Event_Key.OCCURRENCE_TIME]);
        event.detail = await this.defineErrorMessage(2, event);
        event.status = event.detail != '' ? 2 : 1;
      } else {
        throw new Error();
      }

      return {
        status: 1,
        event: event,
      };
    } catch (err) {
      return {
        status: 2,
        event: record,
      };
    }
  }

  async validateEvent(events: any, typeEvent: number, additionalInfo: any) {
    const validEvents = [];
    const invalidEventIndexes = [];
    const offset = additionalInfo.offset ?? 0;

    for (let i = 0; i < events.length; i++) {
      const result = await this.mapInformationEvent(
        events[i],
        typeEvent,
        additionalInfo,
      );
      if (result.status == 1) {
        validEvents.push(result.event);
      } else {
        invalidEventIndexes.push(offset + i);
      }
    }
    return { validEvents: validEvents, inValidEvents: invalidEventIndexes };
  }

  async pushNotification(username: any) {
    const lastUpdated = new Date();
    const now = new Date();
    lastUpdated.setMinutes(lastUpdated.getMinutes() - 30);
    const listIgnoreEvents = await this.ignoreEventsService.getIgnoreEventByUsername(username);

    let avaiEventsQuery = this.availabilityEventsRepository
      .createQueryBuilder('events')
      .select([
        'events.id as id',
        'nodes.custom_id as "nodeId"',
        'events.detail as detail',
        'events.created_at as "createAt"'
      ])
      .innerJoin(Nodes, 'nodes', 'events.node_id = nodes.id')
      .where('events.created_at > :lastUpdated AND events.created_at <= :now', {
        lastUpdated,
        now,
      })
      .andWhere('events.status = 2')
      .orderBy('events.created_at', 'DESC');

    if (listIgnoreEvents && listIgnoreEvents.length > 0) {
      avaiEventsQuery = avaiEventsQuery.andWhere('events.id NOT IN (:...listIgnoreEvents)', { listIgnoreEvents });
    }

    const avaiEvents = await avaiEventsQuery.getRawMany();

    let commEventsQuery = this.communicationEventsRepository
      .createQueryBuilder('events')
      .select([
        'events.id as id',
        'nodes.custom_id as "nodeId"',
        'events.detail as detail',
        'events.created_at as "createAt"'
      ])
      .innerJoin(Nodes, 'nodes', 'events.node_id = nodes.id')
      .where('events.created_at > :lastUpdated AND events.created_at <= :now', {
        lastUpdated,
        now,
      })
      .andWhere('events.status = 2')
      .orderBy('events.created_at', 'DESC');

    if (listIgnoreEvents && listIgnoreEvents.length > 0) {
      commEventsQuery = commEventsQuery.andWhere('events.id NOT IN (:...listIgnoreEvents)', { listIgnoreEvents });
    }

    const commEvents = await commEventsQuery.getRawMany();

    const queryResults = [...avaiEvents, ...commEvents];
    const cleanResult = queryResults.map((event) => {
      return {
        id: event.id,
        nodeId: event.nodeId,
        detail: event.detail,
        status: event.status,
        createAt: event.createAt,
      };
    });
    return cleanResult;
  }

  async getRSUUsage(type: string, period: string): Promise<any> {
    const listNodeLive = (await this.nodeService.findAll()).nodes;
    
    let result = [];
    await Promise.all(
      (await listNodeLive).map(async (rsu) => {
        try {
          const fromDate = new Date();
          const now = new Date();

          let rsuUsage;

          // Last 30 days
          if (period === 'month') {
            fromDate.setDate(fromDate.getDate() - 30);
  
            rsuUsage = await this.availabilityEventsRepository
              .createQueryBuilder('event')
              .select(`DATE(event.created_at) AS timestamp, AVG(event.${type}_usage) AS average`)
              .where('event.node_id = :rsuId AND event.created_at >= :fromDate  AND event.created_at <= :now', { rsuId: rsu.id, fromDate, now })
              .groupBy('DATE(event.created_at)')
              .orderBy('timestamp')
              .execute() as Promise<{ date: string, average: number }[]>;
          }
          // Last 24 hours
          if (period === 'date') {
            fromDate.setHours(fromDate.getHours() - 24);

            rsuUsage = await this.availabilityEventsRepository
              .createQueryBuilder('usage')
              .select(`DATE_TRUNC('hour', usage.created_at) AS timestamp, AVG(usage.${type}_usage) AS average`)
              .where('usage.node_id = :rsuId AND usage.created_at >= :fromDate AND usage.created_at <= :now', { rsuId: rsu.id, fromDate, now })
              .groupBy("DATE_TRUNC('hour', usage.created_at)")
              .orderBy('timestamp')
              .execute() as Promise<{ hour: Date, average: number }[]>;
          }
          // Last 60 minutes
          if (period === 'hour') {
            fromDate.setMinutes(fromDate.getMinutes() - 60);

            rsuUsage = await this.availabilityEventsRepository
              .createQueryBuilder('usage')
              .select(`DATE_TRUNC('minute', usage.created_at) AS timestamp, AVG(usage.${type}_usage) AS average`)
              .where('usage.node_id = :rsuId AND usage.created_at >= :fromDate AND usage.created_at <= :now', { rsuId: rsu.id, fromDate, now })
              .groupBy("DATE_TRUNC('minute', usage.created_at)")
              .orderBy('timestamp')
              .execute() as Promise<{ minute: string, average: number }[]>;
          }
          rsuUsage !== undefined && rsuUsage.length !== 0 && result.push({
            id: rsu.custom_id,
            usage: rsuUsage,
          });
          
        } catch (error) {
          console.error(error);
        } 
      })
    );
    return result.sort((a, b) => a.id.localeCompare(b.id))
  }
}
