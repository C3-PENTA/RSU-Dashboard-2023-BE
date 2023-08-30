import {
  Controller,
  Get,
  Post,
  Res,
  Query,
  UseGuards,
  Body,
  UseInterceptors,
  UploadedFile,
  Delete,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { API_PATH } from 'src/constants';
import { EventsService } from '../service/events.service';
import { JwtAccessTokenGuard } from 'src/modules/auth/guard/jwt-access-token.guard';
import { ExportDataDto } from '../dto/exportData.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { convertToUTC } from 'src/util/convertTimeZone';
import { exportDataToCSV, exportDataToZip } from 'src/util/exportData';
import * as fs from 'fs-extra';
import * as admZip from 'adm-zip';
import * as path from 'path';

@ApiTags('Event Management')
@UseGuards(JwtAccessTokenGuard)
@Controller('api/event-management')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get('events')
  @ApiOperation({
    description: '',
  })
  @ApiOkResponse({
    status: 200,
    description: '',
  })
  @ApiQuery({ name: 'type', required: true })
  @ApiQuery({ name: 'page', required: true })
  @ApiQuery({ name: 'limit', required: true })
  @ApiQuery({ name: 'start-date', required: false, type: Date })
  @ApiQuery({ name: 'end-date', required: false, type: Date })
  @ApiQuery({ name: 'node-id', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'driving-negotiation-class', required: false })
  @ApiQuery({ name: 'message-type', required: false })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: [
      'created_at',
      'cpu_usage',
      'cpu_temp',
      'ram_usage',
      'disk_usage',
      'network_usage',
      'network_status',
    ],
  })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  async getEventsInfo(
    @Query('type') type: number,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('start-date') startDate: Date,
    @Query('end-date') endDate: Date,
    @Query('node-id') nodeIds: string[],
    @Query('status') status: number,
    @Query('driving-negotiation-class') drivingNegotiationClass: number[],
    @Query('message-type') messageType: number[],
    @Query('sort') sortBy: string,
    @Query('order') sortOrder: 'asc' | 'desc',
  ) {
    // handle time input
    const startD = startDate ? new Date(startDate) : null;
    const endD = endDate ? new Date(endDate) : null;
    if (endD) endD.setDate(endD.getDate() + 1);

    //handle query list
    const nodeIdArray = nodeIds
      ? Array.isArray(nodeIds)
        ? nodeIds
        : [nodeIds]
      : null;
    const drivingNegotiationClassArray = drivingNegotiationClass
      ? Array.isArray(drivingNegotiationClass)
        ? drivingNegotiationClass
        : [drivingNegotiationClass]
      : null;
    const messageTypeArray = messageType
      ? Array.isArray(messageType)
        ? messageType
        : [messageType]
      : null;

    return this.eventsService.getEventsList(
      type,
      startD,
      endD,
      nodeIdArray,
      status,
      drivingNegotiationClassArray,
      messageTypeArray,
      limit,
      page,
      sortBy,
      sortOrder,
    );
  }

  @Get('events/summary')
  @ApiOperation({
    description: '',
  })
  @ApiOkResponse({
    status: 200,
    description: '',
  })
  @ApiQuery({ name: 'time_range', required: true, enum: ['all', 'hour_ago']})
  async getEventsSummary(@Query('time_range') time_range: string) {
    const result = await this.eventsService.getEventsSummary(time_range);
    return {
      summary: result.summary.sort((a, b) =>
        a.customId.localeCompare(b.customId),
      ),
    };
  }

  @Get('latest-events')
  @ApiQuery({ name: 'type', required: true })
  @ApiOperation({
    description: 'get latest Events',
  })
  @ApiOkResponse({
    status: 200,
    description: '',
  })
  async getLatestEvents(@Query('type') type: number) {
    if (type == 1) {
      return this.eventsService.getLatestAvailabilityEvents();
    } else {
      return 0;
    }
  }

  @Get('new-events')
  @ApiQuery({ name: 'type', required: true })
  @ApiOperation({
    description: 'get newsEvents',
  })
  @ApiOkResponse({
    status: 200,
    description: '',
  })
  async getNewEvents(@Query('type') type: number) {
    return this.eventsService.getNewEvents();
  }

  @Post('export/csv')
  @ApiOperation({ summary: 'Export data to CSV' })
  @ApiBody({ type: ExportDataDto })
  async exportData(
    @Body() requestBody: { type: number; eventIds: string[] },
    @Res() res: Response,
  ) {
    try {
      const data = await this.eventsService.exportDataToCsv(
        requestBody.type,
        requestBody.eventIds,
      );
      return exportDataToZip(res, data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to export data.' });
    }
  }

  @Post('import')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV file to import',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importCsvData(@UploadedFile() file: Express.Multer.File) {
    try {
      if (file) {
        const uploadPath = 'upload';
        const errorRecords = [];
        let message = 'Data imported successfully';

        // Create directories if they don't exist
        fs.ensureDirSync(uploadPath);

        // Save uploaded file
        const filePath = `${uploadPath}/${file.originalname}`;
        await fs.writeFile(filePath, file.buffer);

        if (file.originalname.endsWith('.zip')) {
          // Extract and process the CSV files within the ZIP archive
          const extractPath = `${uploadPath}/extracted`;

          // Create directories if they don't exist
          fs.ensureDirSync(extractPath);

          // Extract ZIP file using adm-zip
          const zip = new admZip(filePath);
          zip.extractAllTo(extractPath, true);

          // Get a list of extracted files
          const extractedFiles = zip
            .getEntries()
            .map((entry) => entry.entryName);

          // Construct paths of extracted CSV files
          const csvFilePaths = extractedFiles
            .filter((fileName) => fileName.endsWith('.csv'))
            .map((fileName) => path.join(extractPath, fileName));

          // Process extracted CSV files
          let errorFiles = 0;
          let errorLinesInFile = '';
          for (let path of csvFilePaths) {
            const result = await this.eventsService.parseCsvAndSaveToDatabase(
              path,
            );
            if (result.status == 'error') {
              errorFiles += 1;
              errorLinesInFile += `file ${path}`;
            } else {
              errorLinesInFile += result.message;
            }
          }

          if (errorFiles == csvFilePaths.length)
            throw new Error('Failed to import data! Wrong file format');

          if (errorLinesInFile != '') {
            message +=
              ', some lines are ignored due to wrong format: ' +
              errorLinesInFile;
          }
        } else if (file.originalname.endsWith('.csv')) {
          // Parse and process the CSV file
          const result = await this.eventsService.parseCsvAndSaveToDatabase(
            filePath,
          );
          if (result.status == 'error') throw new Error(result.message);
          else {
            if (result.errorRecords.length != 0) {
              message += `, some lines are ignored due to wrong format: ${result.errorRecords}`;
            }
          }
        } else {
          throw new Error('Unsupported file type');
        }
        return {
          status: 'success',
          message: message,
        };
      } else {
        throw new Error('No file uploaded.');
      }
    } catch (err) {
      return {
        status: 'error',
        message: err.message,
      };
    }
  }

  @Delete()
  @ApiQuery({ name: 'type', required: true })
  @ApiQuery({ name: 'event-id', required: false })
  @ApiQuery({ name: 'delete-all', required: false })
  @ApiOperation({
    description: `Delete Event`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'Delete succeeded',
  })
  async deleteEvent(
    @Query('type') type: number,
    @Query('event-id') eventIds: string[],
    @Query('delete-all') deleteAll: string,
  ) {
    let eventList = Array.isArray(eventIds) ? eventIds : [eventIds];
    const isDeletedAll = deleteAll === 'true';
    return this.eventsService.deleteEvent(type, eventList, isDeletedAll);
  }

  @Get('generator/status')
  async getStatusGenerator() {
    const status = this.eventsService.isCronJobEnabled ? 'ON' : 'OFF';
    return { status: status };
  }

  @Post('generator/toggle')
  async toggleGenerator() {
    this.eventsService.isCronJobEnabled = !this.eventsService.isCronJobEnabled;
    const status = this.eventsService.isCronJobEnabled ? 'ON' : 'OFF';
    return { status: status };
  }

  @Post('generator/generate-data')
  @ApiQuery({ name: 'type-event', required: true, enum: [1, 2] })
  @ApiQuery({ name: 'start', required: true })
  @ApiQuery({ name: 'end', required: true })
  async generateData(
    @Query('type-event') typeEvent: number,
    @Query('start') start: string,
    @Query('end') end: string,
    @Res() res: Response
  ) {
    return this.eventsService.generateData(res, typeEvent, start, end);
  }

  @Get('notifications')
  @ApiQuery({ name: 'username', required: true })
  @ApiOperation({
    description: 'get notfications',
  })
  @ApiOkResponse({
    status: 200,
    description: '',
  })
  async getNotifications(@Query('username') username: string) {
    const results = await this.eventsService.pushNotification(username)
    return {
      "notification": results,
    }
  }

  @Get(API_PATH.GET_RSU_USAGE)
  @ApiOperation({
    description: '',
  })
  @ApiOkResponse({
    status: 200,
    description: ''
  })
  @ApiQuery({ name: 'type', required: true, enum: ['ram', 'cpu', 'disk'] })
  @ApiQuery({ name: 'period', required: true, enum: ['month', 'date', 'hour'] })
  async getRSUUsage(@Query('type') type: string, @Query('period') period: string) {
    return await this.eventsService.getRSUUsage(type, period);
  }
}
