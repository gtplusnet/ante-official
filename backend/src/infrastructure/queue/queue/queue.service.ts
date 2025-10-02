import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { QueueType, QueueStatus, QueueLogStatus } from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { QueueCreateDTO, ReinitializeQueueDTO } from './queue.interface';
import { QueueResponse } from '../../../shared/response/queue.response';
import { QueueMongoService } from '@common/services/queue-mongo.service';
import { UtilityService } from '@common/utility.service';
import { QueueConfig } from './queue.config';
import { QueueMongo } from '../../mongodb/queue-mongo.schema';
import { QueueLogMongoService } from '@common/services/queue-log-mongo.service';
import { SocketService } from '@modules/communication/socket/socket/socket.service';

@Injectable()
export class QueueService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly queueConfig: QueueConfig;
  @Inject() private readonly queueMongoService: QueueMongoService;
  @Inject() private readonly queueLogMongoService: QueueLogMongoService;
  @Inject() private readonly socketService: SocketService;

  public batchSize: number = process.env.QUEUE_BATCH_SIZE
    ? parseInt(process.env.QUEUE_BATCH_SIZE)
    : 5;
  public QueueType = QueueType;
  public QueueStatus = QueueStatus;

  async onModuleInit() {
    this.startPendingQueue();
  }
  async getQueueTable(params): Promise<any> {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;

    // Log pagination params for debugging
    console.log('Queue pagination params:', {
      rawPage: params.page,
      rawLimit: params.limit,
      parsedPage: page,
      parsedLimit: limit,
    });

    const queues = await this.queueMongoService.paginate(page, limit);

    const queueResponse = await Promise.all(
      queues.data.map(async (queue) => {
        const formattedQueue = await this.formatResponse(queue);
        return formattedQueue;
      }),
    );

    return {
      data: queueResponse,
      total: queues.total,
      page: queues.page,
      lastPage: queues.lastPage,
    };
  }

  async getQueueInfo(id: string, includeLogs = false): Promise<QueueResponse> {
    const queueInformation = await this.queueMongoService.findById(String(id));
    if (!queueInformation) {
      return null;
    }
    return this.formatResponse(queueInformation, includeLogs);
  }

  async reinitializeQueue(params: ReinitializeQueueDTO): Promise<any> {
    const queueInformation = await this.queueMongoService.findById(
      String(params.queueId),
    );
    if (!queueInformation) {
      return null;
    }

    await this.queueMongoService.updateStatus(
      String(params.queueId),
      params.status,
    );
    return queueInformation;
  }

  public async createQueue(params: QueueCreateDTO): Promise<QueueResponse> {
    await this.validateQueue(params);

    const paramsQueue: any = {
      name: params.name,
      type: params.type,
      fileId: params.fileId,
    };

    if (params.queueSettings) {
      paramsQueue.queueSettings = params.queueSettings;
    }

    const response = await this.queueMongoService.create(paramsQueue);
    return this.formatResponse(response);
  }

  private async validateQueue(params: QueueCreateDTO) {
    if (params.fileId) {
      const checkFileExist = await this.prisma.files.findUnique({
        where: {
          id: params.fileId,
        },
      });

      if (!checkFileExist) {
        throw new BadRequestException('File not found');
      }
    }
  }

  async startPendingQueue(): Promise<void> {
    await this.pendingQueues();
    await this.processingQueues();
  }

  async processingQueues(): Promise<void> {
    let processingQueues: QueueMongo[] = [];

    try {
      processingQueues = await this.queueMongoService.findByStatus(
        QueueStatus.PROCESSING,
      );
    } catch (error) {
      this.utilityService.error(
        'Error fetching processing queues: ' + error.message,
      );
    }

    if (processingQueues.length) {
      for (const queue of processingQueues) {
        const processQueue = this.queueConfig.getQueueService(queue.type);
        let logQueues = [];

        try {
          logQueues = await this.queueLogMongoService.findByQueueIDAndStatus(
            queue._id as string,
            QueueLogStatus.PENDING,
            this.batchSize,
          );
        } catch (error) {
          this.utilityService.error(
            'Error fetching queue logs: ' + error.message,
          );
        }

        if (logQueues.length) {
          await Promise.all(
            logQueues.map(async (logQueue) => {
              try {
                await this.queueLogMongoService.updateStatus(
                  logQueue._id as string,
                  QueueLogStatus.PROCESSING,
                );
                await processQueue.processQueueLog(logQueue);
                await this.queueLogMongoService.updateStatus(
                  logQueue._id as string,
                  QueueLogStatus.COMPLETED,
                );
              } catch (error) {
                this.utilityService.error(
                  'Error processing queue log: ' + error.stack,
                );
                await this.queueLogMongoService.updateStatus(
                  logQueue._id as string,
                  QueueLogStatus.FAILED,
                  error.stack,
                );
              }
            }),
          );

          const currentCount = queue.currentCount + logQueues.length;
          const completePercentage =
            Math.floor((currentCount / queue.totalCount) * 100) / 100;
          const formattedCompletePercentage =
            this.utilityService.formatPercentage(completePercentage);

          await this.queueMongoService.update(queue._id as string, {
            currentCount: currentCount,
            completePercentage: completePercentage,
          });

          // Emit queue progress update via socket
          this.emitQueueProgressUpdate(
            queue._id as string,
            currentCount,
            queue.totalCount,
            QueueStatus.PROCESSING,
            completePercentage,
          );

          this.utilityService.log(
            'Queue #' +
              queue._id +
              ' is ' +
              formattedCompletePercentage.formatPercentage +
              ' completed.',
          );
        } else {
          this.utilityService.log(
            'No more pending queue log found for queue #' +
              queue._id +
              '. Marking queue as completed.',
          );

          // Check if there is failure inside pending queue log
          const checkFailedQueueLog =
            await this.queueLogMongoService.findByQueueIDAndStatus(
              queue._id as string,
              QueueLogStatus.FAILED,
            );

          if (checkFailedQueueLog.length) {
            await this.queueMongoService.updateStatus(
              queue._id as string,
              QueueStatus.INCOMPLETE,
            );
            this.utilityService.error(
              'Queue #' + queue._id + ' has failed queue log.',
            );
          } else {
            await this.queueMongoService.updateStatus(
              queue._id as string,
              QueueStatus.COMPLETED,
            );
          }
        }
      }
    }

    setTimeout(() => {
      this.processingQueues();
    }, 100);
  }

  async pendingQueues(): Promise<void> {
    let pendingQueues: QueueMongo[] = [];

    try {
      pendingQueues = await this.queueMongoService.findByStatus(
        QueueStatus.PENDING,
      );
    } catch (error) {
      this.utilityService.error(
        'Error fetching pending queues: ' + error.message,
      );
    }

    for (const queue of pendingQueues) {
      const processQueue = this.queueConfig.getQueueService(queue.type);
      await this.processPendingQeuee(processQueue, queue);
    }

    setTimeout(() => {
      this.pendingQueues();
    }, 100);
  }

  async processPendingQeuee(processQueue, queue): Promise<void> {
    try {
      await processQueue.processPendingQueue(queue);

      await this.queueMongoService.update(queue._id, {
        status: QueueStatus.PROCESSING,
      });
    } catch (error) {
      this.utilityService.error(
        'Error processing Queue #' + queue._id + ': ' + error.stack,
      );

      await this.queueMongoService.update(queue._id, {
        status: QueueStatus.FAILED,
        errorStatus: error.message,
      });
    }
  }

  private async formatResponse(
    data,
    includeLogs = false,
  ): Promise<QueueResponse> {
    const queueLogs = await this.queueLogMongoService.findByQueueId(
      data._id as string,
    );

    let queueLogResponse = [];

    if (includeLogs) {
      queueLogResponse = await Promise.all(
        queueLogs.map(async (log) => {
          const formattedLog = await this.formateQueueLogResponse(log);
          return {
            ...formattedLog,
            createdAt: this.utilityService.formatDate(log['createdAt']),
            updatedAt: this.utilityService.formatDate(log['updatedAt']),
          };
        }),
      );
    }
    const response: QueueResponse = {
      id: data._id,
      name: data.name,
      type: data.type,
      status: data.status,
      completePercentage: this.utilityService.formatPercentage(
        data.completePercentage,
      ),
      currentCount: this.utilityService.formatNumber(data.currentCount),
      totalCount: this.utilityService.formatNumber(data.totalCount),
      queueSettings: data.queueSettings,
      createdAt: this.utilityService.formatDate(data.createdAt),
      updatedAt: this.utilityService.formatDate(data.updatedAt),
      logs: queueLogResponse,
    };

    return response;
  }

  private emitQueueProgressUpdate(
    queueId: string,
    currentCount: number,
    totalCount: number,
    status: QueueStatus,
    completePercentage: number,
  ): void {
    try {
      // Get queue settings to find the cutoffDateRangeId if it's a payroll processing queue
      this.queueMongoService.findById(queueId).then((queue) => {
        if (
          queue &&
          queue.queueSettings &&
          queue.queueSettings['cutoffDateRangeId']
        ) {
          const cutoffDateRangeId = queue.queueSettings['cutoffDateRangeId'];

          // Emit to all users in the company
          // We need to get the company ID from somewhere - let's assume it's in utility service
          const companyId = this.utilityService.companyId;

          if (companyId) {
            this.socketService.emitToCompany(
              companyId,
              'queue-progress-updated',
              {
                queueId,
                cutoffDateRangeId,
                currentCount,
                totalCount,
                status,
                completePercentage,
                companyId,
              },
            );
          }
        }
      });
    } catch (error) {
      this.utilityService.error(
        'Error emitting queue progress update: ' + error.message,
      );
    }
  }

  private async formateQueueLogResponse(data): Promise<any> {
    const response: any = {
      id: data._id,
      queueId: data.queueId,
      params: data.params,
      status: data.status,
      errorStatus: data.errorStatus,
      message: data.message,
      createdAt: this.utilityService.formatDate(data.createdAt),
      updatedAt: this.utilityService.formatDate(data.updatedAt),
    };

    return response;
  }
}
