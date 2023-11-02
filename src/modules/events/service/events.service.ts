import { Injectable, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';
import { CommunicationEvents } from '../entity/communication-events.entity';
import { AvailabilityEvents } from '../entity/availability-events.entity';
import { Nodes } from 'src/modules/nodes/entity/nodes.entity';
import {
  CommunicationMethod,
  MessageType,
  NetworkStatus,
  NodeType,
  Event_Key,
} from 'src/constants';
import { mergeResults } from 'src/util/mergeResultsEventSummary';
import { Cron } from '@nestjs/schedule';
import { NodeService } from 'src/modules/nodes/service/nodes.service';
import { isValidHeader } from 'src/util/isValidFileImport';
import { getEnumValue } from 'src/util/handleEnumValue';
import * as moment from 'moment-timezone';
import e, { Response } from 'express';
import * as fs from 'fs-extra';
import * as fastcsv from 'fast-csv';
import { exportDataToZip } from 'src/util/exportData';
import { IgnoreEventsService } from 'src/modules/users/service/ignore-events.service';
import { HttpHelper } from '@util/http';
import {
  convertUnixToFormat,
  convertTimeZone,
  convertToUTC,
  randomChoice,
  randomNumber,
} from '@util/function';
import { GatewayService } from 'src/modules/gateway/service/gateway.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(CommunicationEvents)
    private communicationEventsRepository: Repository<CommunicationEvents>,
    @InjectRepository(AvailabilityEvents)
    private availabilityEventsRepository: Repository<AvailabilityEvents>,
    @InjectRepository(Nodes)
    private NodesRepo: Repository<Nodes>,
    private nodeService: NodeService,
    private ignoreEventsService: IgnoreEventsService,
    private gatewayService: GatewayService
  ) {}

  async saveEvent(type: number, events: any) {
    try {
      if (type === 1) {
        return this.availabilityEventsRepository.save(events);
      } else if (type === 2) {
        return this.communicationEventsRepository.save(events);
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
        node_id: event.nodeId,
        cooperationClass: event.cooperationClass,
        method: event.method,
        src_node: event.srcNode,
        dest_node: event.destNode,
        message_type: event.messageType,
        created_at: event.createdAt,
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
          'nodes.rsu_id as "nodeId"',
          'nodes.name as "nodeType"',
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
          'nodes.rsu_id as "nodeId"',
          'nodes.name as "nodeType"',
          'src_node.rsu_id as "srcNode"',
          'dest_node.rsu_id as "destNode"',
          'events.cooperation_class as "drivingNegotiationsClass"',
          'events.communication_class as "communicationClass"',
          'events.session_id as "sessionID"',
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
            ? 'events.cooperation_class IN (:...drivingNegotiationClass)'
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
          nodeType: event.nodeType,
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
          nodeType: event.nodeType,
          srcNode: event.srcNode ? event.srcNode : 'B',
          destNode: event.destNode ? event.destNode : 'B',
          cooperationClass: event.drivingNegotiationsClass,
          communicationClass: event.communicationClass,
          sessionID: event.sessionID,
          method: event.method,
          messageType: event.messageType,
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
        'nodes.rsu_id as "customId"',
        'COUNT(node_id) as "totalAvailabilityNormal"',
      ])
      .innerJoin(Nodes, 'nodes', 'avai_events.node_id = nodes.id')
      .where('avai_events.status = 1')
      .groupBy('avai_events.node_id, nodes.rsu_id');

    const communicationNormal = this.communicationEventsRepository
      .createQueryBuilder('comm_events')
      .select([
        'node_id as "nodeId"',
        'nodes.rsu_id as "customId"',
        'COUNT(node_id) as "totalCommunicationNormal"',
      ])
      .innerJoin(Nodes, 'nodes', 'comm_events.node_id = nodes.id')
      .where('comm_events.status = 1')
      .groupBy('comm_events.node_id, nodes.rsu_id');

    const availabilityError = this.availabilityEventsRepository
      .createQueryBuilder('avai_events')
      .select([
        'node_id as "nodeId"',
        'nodes.rsu_id as "customId"',
        'COUNT(node_id) as "totalAvailabilityError"',
      ])
      .innerJoin(Nodes, 'nodes', 'avai_events.node_id = nodes.id')
      .where('avai_events.status = 2')
      .groupBy('avai_events.node_id, nodes.rsu_id');

    const communicationError = this.communicationEventsRepository
      .createQueryBuilder('comm_events')
      .select([
        'node_id as "nodeId"',
        'nodes.rsu_id as "customId"',
        'COUNT(node_id) as "totalCommunicationError"',
      ])
      .innerJoin(Nodes, 'nodes', 'comm_events.node_id = nodes.id')
      .where('comm_events.status = 2')
      .groupBy('comm_events.node_id, nodes.rsu_id');

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
          .andWhere('avai_events.created_at > :timestamp', {
            timestamp: hourAgo,
          })
          .getRawMany(),
        availabilityError
          .andWhere('avai_events.created_at > :timestamp', {
            timestamp: hourAgo,
          })
          .getRawMany(),
        communicationNormal
          .andWhere('comm_events.created_at > :timestamp', {
            timestamp: hourAgo,
          })
          .getRawMany(),
        communicationError
          .andWhere('comm_events.created_at > :timestamp', {
            timestamp: hourAgo,
          })
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
        nodes.rsu_id,
        nodes.name,
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
      ORDER BY nodes.rsu_id
    `;

    const result = await this.availabilityEventsRepository.query(query);
    return result.map((ele) => {
      ele.network_speed = ele.network_speed ?? '-';
      if (ele.network_speed != '-') ele.network_speed += ' Mbps';

      ele.network_usage = ele.network_usage ?? '-';
      if (ele.network_usage != '-') ele.network_usage += ' Byte';

      return {
        eventId: ele.id,
        nodeId: ele.rsu_id,
        nodeType: ele.type,
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

  async exportLogData(type: number, eventIds: string[], log: boolean) {
    try {
      if (type == 1) {
        const result = await this.availabilityEventsRepository
          .createQueryBuilder('events')
          .select([
            'nodes.rsu_id as "nodeId"',
            'nodes.name as "nodeType"',
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

        return log
          ? result.map((event) => {
              return {
                [Event_Key.OCCURRENCE_TIME]: convertTimeZone(event.createdAt),
                [Event_Key.NODE_ID]: event.nodeId,
                [Event_Key.NODE_TYPE]: event.nodeType,
                [Event_Key.CPU_USAGE]: event.cpuUsage,
                [Event_Key.CPU_TEMPERATURE]: event.cpuTemp,
                [Event_Key.RAM_USAGE]: event.ramUsage,
                [Event_Key.DISK_USAGE]: event.diskUsage,
                [Event_Key.NETWORK_SPEED]: event.networkSpeed
                  ? event.networkSpeed + ' Mbps'
                  : null,
                [Event_Key.NETWORK_USAGE]: event.networkUsage
                  ? event.networkUsage + ' Byte'
                  : null,
                [Event_Key.NETWORK_CONNECTION_STATUS]:
                  NetworkStatus[event.networkStatus],
                [Event_Key.DETAIL]: event.detail,
              };
            })
          : result.map((event) => {
              return {
                [Event_Key.OCCURRENCE_TIME]: convertTimeZone(event.createdAt),
                [Event_Key.NODE_ID]: event.nodeId,
                [Event_Key.CPU_USAGE]: event.cpuUsage,
                [Event_Key.CPU_TEMPERATURE]: event.cpuTemp,
                [Event_Key.RAM_USAGE]: event.ramUsage,
                [Event_Key.DISK_USAGE]: event.diskUsage,
                [Event_Key.NETWORK_SPEED]: event.networkSpeed
                  ? event.networkSpeed + ' Mbps'
                  : null,
                [Event_Key.NETWORK_USAGE]: event.networkUsage
                  ? event.networkUsage + ' Byte'
                  : null,
                [Event_Key.NETWORK_CONNECTION_STATUS]:
                  NetworkStatus[event.networkStatus],
              };
            });
      } else if (type == 2) {
        const result = await this.communicationEventsRepository
          .createQueryBuilder('events')
          .select([
            'events.id as id',
            'nodes.rsu_id as "nodeId"',
            'nodes.name as "nodeType"',
            'src_node.rsu_id as "srcNode"',
            'dest_node.rsu_id as "destNode"',
            'events.cooperation_class as "cooperationClass"',
            'events.session_id as "sessionID"',
            'events.communication_class as "communicationClass"',
            'events.method as method',
            'events.message_type as "messageType"',
            'events.status as status',
            'events.created_at as "createdAt"',
            'events.detail as detail',
          ])
          .innerJoin(Nodes, 'nodes', 'events.node_id = nodes.id')
          .leftJoin(Nodes, 'src_node', 'events.src_node = src_node.id')
          .leftJoin(Nodes, 'dest_node', 'events.dest_node = dest_node.id')
          .where({ id: In(eventIds) })
          .getRawMany();

        return log
          ? result.map((event) => {
              return {
                [Event_Key.OCCURRENCE_TIME]: convertTimeZone(event.createdAt),
                [Event_Key.NODE_ID]: event.nodeId,
                [Event_Key.NODE_TYPE]: event.nodeType,
                [Event_Key.SRC_NODE]: event.srcNode,
                [Event_Key.DEST_NODE]: event.destNode ?? 'B',
                [Event_Key.COOPERATION_CLASS]: event.cooperationClass,
                [Event_Key.SESSION_ID]: event.sessionID,
                [Event_Key.COMMUNICATION_CLASS]: event.communicationClass,
                [Event_Key.METHOD]: event.method,
                [Event_Key.MESSAGE_TYPE]: event.messageType,
                [Event_Key.DETAIL]: event.detail,
              };
            })
          : result.map((event) => {
              return {
                [Event_Key.OCCURRENCE_TIME]: convertTimeZone(event.createdAt),
                [Event_Key.NODE_ID]: event.nodeId,
                [Event_Key.SRC_NODE]: event.srcNode,
                [Event_Key.DEST_NODE]: event.destNode ?? 'B',
                [Event_Key.COOPERATION_CLASS]: event.cooperationClass,
                [Event_Key.SESSION_ID]: event.sessionID,
                [Event_Key.COMMUNICATION_CLASS]: event.communicationClass,
                [Event_Key.METHOD]: event.method,
                [Event_Key.MESSAGE_TYPE]: event.messageType,
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
        networkUsage = networkUsage < 0 ? null : networkUsage;

        if (
          networkStatus == 2 &&
          (record[Event_Key.NETWORK_USAGE] != '' ||
            record[Event_Key.NETWORK_SPEED] != '')
        ) {
          throw new Error();
        }

        const event = new AvailabilityEvents();
        event.nodeId =
          node ??
          (() => {
            throw new Error();
          })();
        event.cpuUsage =
          cpuUsage ??
          (() => {
            throw new Error();
          })();
        event.cpuTemp =
          cpuTemp ??
          (() => {
            throw new Error();
          })();
        event.ramUsage =
          ramUsage ??
          (() => {
            throw new Error();
          })();
        event.diskUsage =
          diskUsage ??
          (() => {
            throw new Error();
          })();
        event.networkStatus =
          networkStatus ??
          (() => {
            throw new Error();
          })();
        event.networkSpeed =
          typeof networkSpeed !== 'undefined'
            ? Number.isNaN(networkSpeed)
              ? null
              : networkSpeed
            : (() => {
                throw new Error();
              })();
        event.networkUsage =
          typeof networkUsage !== 'undefined'
            ? Number.isNaN(networkUsage)
              ? null
              : networkUsage
            : (() => {
                throw new Error();
              })();
        event.createdAt = moment(
          convertToUTC(record[Event_Key.OCCURRENCE_TIME]),
        ).toDate();
        event.detail = await this.defineErrorMessage(1, event);
        event.status = event.detail != '' ? 2 : 1;

        return {
          status: 1,
          event: event,
        };
      } else if (typeEvent == 2) {
        const event = new CommunicationEvents();

        event.nodeId =
          record[Event_Key.NODE_ID] != 'B'
            ? additionalInfo.nodeInfo.get(record[Event_Key.NODE_ID])
            : null;
        event.destNode =
          record[Event_Key.DEST_NODE] != 'B'
            ? additionalInfo.nodeInfo.get(record[Event_Key.DEST_NODE])
            : null;
        event.srcNode =
          record[Event_Key.SRC_NODE] != 'B'
            ? additionalInfo.nodeInfo.get(record[Event_Key.SRC_NODE])
            : null;

        event.cooperationClass =
          record[Event_Key.COOPERATION_CLASS] ??
          (() => {
            throw new Error();
          })();
        event.sessionId =
          record[Event_Key.SESSION_ID] ??
          (() => {
            throw new Error();
          })();
        event.communicationClass =
          record[Event_Key.COMMUNICATION_CLASS] ??
          (() => {
            throw new Error();
          })();
        event.method =
          record[Event_Key.METHOD] ??
          (() => {
            throw new Error();
          })();
        event.messageType =
          record[Event_Key.MESSAGE_TYPE] ??
          (() => {
            throw new Error();
          })();
        event.createdAt = moment(
          convertToUTC(record[Event_Key.OCCURRENCE_TIME]),
        ).toDate();
        event.detail = '';
        event.status = event.detail != '' ? 2 : 1;

        return {
          status: 1,
          event: event,
        };
      } else {
        throw new Error();
      }
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
    const listIgnoreEvents =
      await this.ignoreEventsService.getIgnoreEventByUsername(username);

    let avaiEventsQuery = this.availabilityEventsRepository
      .createQueryBuilder('events')
      .select([
        'events.id as id',
        'nodes.rsu_id as "nodeId"',
        'events.detail as detail',
        'events.created_at as "createAt"',
      ])
      .innerJoin(Nodes, 'nodes', 'events.node_id = nodes.id')
      .where('events.created_at > :lastUpdated AND events.created_at <= :now', {
        lastUpdated,
        now,
      })
      .andWhere('events.status = 2')
      .orderBy('events.created_at', 'DESC');

    if (listIgnoreEvents && listIgnoreEvents.length > 0) {
      avaiEventsQuery = avaiEventsQuery.andWhere(
        'events.id NOT IN (:...listIgnoreEvents)',
        { listIgnoreEvents },
      );
    }

    const avaiEvents = await avaiEventsQuery.getRawMany();

    let commEventsQuery = this.communicationEventsRepository
      .createQueryBuilder('events')
      .select([
        'events.id as id',
        'nodes.rsu_id as "nodeId"',
        'events.detail as detail',
        'events.created_at as "createAt"',
      ])
      .innerJoin(Nodes, 'nodes', 'events.node_id = nodes.id')
      .where('events.created_at > :lastUpdated AND events.created_at <= :now', {
        lastUpdated,
        now,
      })
      .andWhere('events.status = 2')
      .orderBy('events.created_at', 'DESC');

    if (listIgnoreEvents && listIgnoreEvents.length > 0) {
      commEventsQuery = commEventsQuery.andWhere(
        'events.id NOT IN (:...listIgnoreEvents)',
        { listIgnoreEvents },
      );
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
      (
        await listNodeLive
      ).map(async (rsu) => {
        try {
          const fromDate = new Date();
          const now = new Date();

          let rsuUsage;

          // Last 30 days
          if (period === 'month') {
            fromDate.setDate(fromDate.getDate() - 30);

            rsuUsage = (await this.availabilityEventsRepository
              .createQueryBuilder('event')
              .select(
                `DATE(event.created_at) AS timestamp, AVG(event.${type}_usage) AS average`,
              )
              .where(
                'event.node_id = :rsuId AND event.created_at >= :fromDate  AND event.created_at <= :now',
                { rsuId: rsu.id, fromDate, now },
              )
              .groupBy('DATE(event.created_at)')
              .orderBy('timestamp')
              .execute()) as Promise<{ date: string; average: number }[]>;
          }
          // Last 24 hours
          if (period === 'date') {
            fromDate.setHours(fromDate.getHours() - 24);

            rsuUsage = (await this.availabilityEventsRepository
              .createQueryBuilder('usage')
              .select(
                `DATE_TRUNC('hour', usage.created_at) AS timestamp, AVG(usage.${type}_usage) AS average`,
              )
              .where(
                'usage.node_id = :rsuId AND usage.created_at >= :fromDate AND usage.created_at <= :now',
                { rsuId: rsu.id, fromDate, now },
              )
              .groupBy("DATE_TRUNC('hour', usage.created_at)")
              .orderBy('timestamp')
              .execute()) as Promise<{ hour: Date; average: number }[]>;
          }
          // Last 60 minutes
          if (period === 'hour') {
            fromDate.setMinutes(fromDate.getMinutes() - 60);

            rsuUsage = (await this.availabilityEventsRepository
              .createQueryBuilder('usage')
              .select(
                `DATE_TRUNC('minute', usage.created_at) AS timestamp, AVG(usage.${type}_usage) AS average`,
              )
              .where(
                'usage.node_id = :rsuId AND usage.created_at >= :fromDate AND usage.created_at <= :now',
                { rsuId: rsu.id, fromDate, now },
              )
              .groupBy("DATE_TRUNC('minute', usage.created_at)")
              .orderBy('timestamp')
              .execute()) as Promise<{ minute: string; average: number }[]>;
          }
          rsuUsage !== undefined &&
            rsuUsage.length !== 0 &&
            result.push({
              id: rsu.rsuID,
              usage: rsuUsage,
            });
        } catch (error) {
          console.error(error);
        }
      }),
    );
    return result.sort((a, b) => a.id.localeCompare(b.id));
  }

  async parseDataToAvailEvent(message: any) {
    let node = await this.nodeService.findOne({ rsuID: message.nodeID });

    if (!node) {
      node = new Nodes();
      node.rsuID = message.nodeID;
    }
    node.name = message.rsuName ?? null;
    node.latitude = message.latitude ?? null;
    node.longitude = message.longitude ?? null;

    const result = await this.NodesRepo.save(node);

    let event = new AvailabilityEvents();
    event.nodeId = result.id;
    event.createdAt = convertUnixToFormat(message.timeStamp);
    event.cpuUsage = message.cpuUsage;
    event.cpuTemp = message.cpuTemperature;
    event.ramUsage = message.ramUsage;
    event.diskUsage = message.diskUsage;
    event.networkStatus = message.rsuConnection == true ? 1 : 2;
    event.networkSpeed = message.networkSpeed ? message.networkSpeed : null;
    event.networkUsage = message.networkUsage ? message.networkUsage : null;
    event.detail = await this.defineErrorMessage(1, event);
    event.status = event.detail.length > 0 ? 2 : 1;
    return event;
  }

  async parseDataToCommEvent(data: any) {
    const messageList = data.messageList;

    const nodeIDMap = (await this.nodeService.getMapNodeList()).customMap;

    const eventList = [];

    for (let message of messageList) {
      let nodeID = nodeIDMap.get(message.nodeID);
      if (!nodeID) {
        nodeID = (
          await this.nodeService.createNode({
            rsuID: message.nodeID,
            name: message.rsuName,
          })
        ).id;
        nodeIDMap.set(message.nodeID, nodeID);
      }

      let srcNodeID = nodeIDMap.get(message.senderNodeID);
      if (!srcNodeID) {
        srcNodeID = (
          await this.nodeService.createNode({ rsuID: message.senderNodeID })
        ).id;
        nodeIDMap.set(message.senderNodeID, srcNodeID);
      }

      let destNodeID = nodeIDMap.get(message.receiverNodeID);
      if (!destNodeID && message.receiverNodeID !== 'B') {
        destNodeID = (
          await this.nodeService.createNode({ rsuID: message.receiverNodeID })
        ).id;
        nodeIDMap.set(message.receiverNodeID, destNodeID);
      }

      const event = new CommunicationEvents();
      event.createdAt = convertUnixToFormat(message.timeStamp);
      event.nodeId = nodeID;
      event.cooperationClass = message.cooperationClass;
      event.sessionId = message.sessionID;
      event.messageType = message.messageType;
      event.method = message.communicationType;
      event.communicationClass = message.communicationClass;

      event.destNode = message.receiverNodeID != 'B' ? destNodeID : null;

      event.srcNode = message.senderNodeID != 'B' ? srcNodeID : null;
      event.detail = '';
      event.status = event.detail.length > 0 ? 2 : 1;
      eventList.push(event);
    }

    return eventList;
  }

  // async cronJobUpdateAvailData() {
  //   // get latest data
  //   const res = await HttpHelper.post({
  //     url: `${process.env.EDGE_SYSTEM_DOMAIN}/edge/status`,
  //     headers: {
  //       'api-key': process.env.API_KEY,
  //     },
  //   });

  //   console.log(res);
  //   if (res?.status !== 200) {
  //     return;
  //   }
  // }
  //   const eventList = [];
  //   const statusList = res.data.statusList;

  //   for (let status of statusList) {
  //     let node = await this.nodeService.findOne({ customId: status.nodeID });

  //     if (!node) {
  //       node = new Nodes();
  //       node.customId = status.nodeID;
  //     }
  //     node.name = status.rsuName;
  //     node.latitude = status.latitude;
  //     node.longitude = status.longitude;

  //     const result = await this.NodesRepo.save(node);

  //     let event = new AvailabilityEvents();
  //     event.nodeId = result.id;
  //     event.createdAt = convertUnixToFormat(status.timeStamp);
  //     event.cpuUsage = status.cpuUsage;
  //     event.cpuTemp = status.cpuTemperature;
  //     event.ramUsage = status.ramUsage;
  //     event.diskUsage = status.diskUsage;
  //     event.networkStatus = status.rsuConnection == true ? 1 : 2;
  //     event.networkSpeed = status.networkSpeed ? status.networkSpeed : null;
  //     event.networkUsage = status.networkUsage ? status.networkUsage : null;
  //     event.detail = await this.defineErrorMessage(1, event);
  //     event.status = event.detail.length > 0 ? 2 : 1;

  //     eventList.push(event);
  //   }

  //   await this.availabilityEventsRepository.save(eventList);
  // }

  // @Cron('0 */1 * * * *')
  // async cronJobUpdateCommData() {
  //   // get latest data
  //   const res = await HttpHelper.get({
  //     url: `${process.env.EDGE_SYSTEM_DOMAIN}/edge/message`,
  //     headers: {
  //       'api-key': process.env.X_API_KEY,
  //     },
  //   });

  //   if (res?.status !== 200) {
  //     return;
  //   }

  //   const messageList = res.data.messageList;

  //   const nodeIDMap = (await this.nodeService.getMapNodeList()).customMap;
  //   const eventList = [];

  //   for (let message of messageList) {
  //     const event = new CommunicationEvents();
  //     event.createdAt = convertUnixToFormat(message.timeStamp);
  //     event.nodeId = nodeIDMap.get(message.nodeID);
  //     event.cooperationClass = message.cooperationClass;
  //     event.sessionId = message.sessionID;
  //     event.messageType = message.messageType;
  //     event.method = message.communicationType;
  //     event.communicationClass = message.communicationClass;

  //     event.destNode =
  //       message.receiverNodeID != 'B'
  //         ? nodeIDMap.get(message.receiverNodeID)
  //         : null;

  //     event.srcNode =
  //       message.senderNodeID != 'B'
  //         ? nodeIDMap.get(message.senderNodeID)
  //         : null;

  //     eventList.push(event);
  //   }
  //   await this.communicationEventsRepository.save(eventList);
  // }
}
