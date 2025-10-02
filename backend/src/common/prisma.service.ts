import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private eventEmitter: EventEmitter2;

  constructor() {
    super({
      transactionOptions: {
        maxWait: 10000, // 10 seconds max wait
        timeout: 30000, // 30 seconds transaction timeout
      },
    });

    // Add middleware to watch task changes
    this.$use(async (params, next) => {
      // Only watch Task model operations
      if (params.model === 'Task') {
        const result = await next(params);

        // Emit event for task changes
        if (
          params.action === 'create' ||
          params.action === 'update' ||
          params.action === 'delete'
        ) {
          try {
            // Get the task with related data
            let taskData = null;
            let affectedUserIds: string[] = [];

            if (params.action !== 'delete' && result && result.id) {
              // For create/update, fetch the complete task data
              taskData = await this.task.findUnique({
                where: { id: result.id },
                include: {
                  assignedTo: true,
                  createdBy: true,
                  boardLane: true,
                  ApprovalMetadata: true,
                },
              });

              // Collect affected user IDs
              if (taskData) {
                if (taskData.assignedToId)
                  affectedUserIds.push(taskData.assignedToId);
                if (taskData.createdById)
                  affectedUserIds.push(taskData.createdById);

                // For approval tasks, also include the person who created the original item
                if (
                  taskData.ApprovalMetadata &&
                  taskData.ApprovalMetadata.sourceModule === 'HR_FILING'
                ) {
                  // Get the filing to find the account
                  try {
                    const filing = await this.payrollFiling.findUnique({
                      where: {
                        id: parseInt(taskData.ApprovalMetadata.sourceId),
                      },
                      select: { accountId: true },
                    });
                    if (filing && filing.accountId) {
                      affectedUserIds.push(filing.accountId);
                    }
                  } catch (e) {
                    console.warn(
                      'Could not fetch filing for approval task:',
                      e,
                    );
                  }
                }

                // Remove duplicates
                affectedUserIds = [...new Set(affectedUserIds)];
              }
            } else if (params.action === 'delete') {
              // For delete, we only have the result which might contain limited data
              taskData = result;
            }

            // Emit event that will be caught by a listener
            if (this.eventEmitter) {
              console.log(
                `[PrismaService] Emitting task.changed event for ${params.action} on task ${result?.id || params.args.where?.id}`,
              );
              console.log(
                `[PrismaService] Affected users for task change:`,
                affectedUserIds,
              );
              this.eventEmitter.emit('task.changed', {
                action: params.action,
                taskId: result?.id || params.args.where?.id,
                task: taskData,
                affectedUserIds,
                timestamp: new Date().toISOString(),
              });
            } else {
              console.warn(
                '[PrismaService] EventEmitter not set - cannot emit task.changed event',
              );
            }
          } catch (error) {
            // Log error but don't interrupt the operation
            console.error('Error emitting task change event:', error);
          }
        }

        return result;
      }

      return next(params);
    });

    // Add middleware to watch filing changes
    this.$use(async (params, next) => {
      // Only watch PayrollFiling model operations
      if (params.model === 'PayrollFiling') {
        const result = await next(params);

        // Emit event for filing changes
        if (
          params.action === 'create' ||
          params.action === 'update' ||
          params.action === 'delete'
        ) {
          try {
            // Get the filing with related data
            let filingData = null;
            let affectedUserIds: string[] = [];

            if (params.action !== 'delete' && result && result.id) {
              // For create/update, fetch the complete filing data
              filingData = await this.payrollFiling.findUnique({
                where: { id: result.id },
                include: {
                  account: true,
                },
              });

              // Collect affected user IDs
              if (filingData) {
                if (filingData.accountId)
                  affectedUserIds.push(filingData.accountId);

                // Also include the approver(s) who need to see filing updates
                // For new filings, we need to find who will receive the approval task
                if (params.action === 'create' || params.action === 'update') {
                  try {
                    // Get the account who created the filing to find their manager
                    const account = await this.account.findUnique({
                      where: { id: filingData.accountId },
                      select: { parentAccountId: true },
                    });

                    if (account && account.parentAccountId) {
                      affectedUserIds.push(account.parentAccountId);
                    }

                    // If filing has an approvalTaskId, also get the assignee of that task
                    if (filingData.approvalTaskId) {
                      const task = await this.task.findUnique({
                        where: { id: filingData.approvalTaskId },
                        select: { assignedToId: true, createdById: true },
                      });
                      if (task) {
                        if (task.assignedToId)
                          affectedUserIds.push(task.assignedToId);
                        if (task.createdById)
                          affectedUserIds.push(task.createdById);
                      }
                    }

                    // Also find any open tasks related to this filing
                    const relatedTasks = await this.task.findMany({
                      where: {
                        ApprovalMetadata: {
                          sourceModule: 'HR_FILING',
                          sourceId: filingData.id.toString(),
                        },
                        isOpen: true,
                      },
                      select: { assignedToId: true, createdById: true },
                    });

                    relatedTasks.forEach((task) => {
                      if (task.assignedToId)
                        affectedUserIds.push(task.assignedToId);
                      if (task.createdById)
                        affectedUserIds.push(task.createdById);
                    });
                  } catch (e) {
                    console.warn('Could not fetch approvers for filing:', e);
                  }
                }

                // Remove duplicates
                affectedUserIds = [...new Set(affectedUserIds)];
              }
            } else if (params.action === 'delete') {
              // For delete, we only have the result which might contain limited data
              filingData = result;
            }

            // Emit event that will be caught by a listener
            if (this.eventEmitter) {
              console.log(
                `[PrismaService] Emitting filing.changed event for ${params.action} on filing ${result?.id || params.args.where?.id}`,
              );
              console.log(
                `[PrismaService] Affected users for filing change:`,
                affectedUserIds,
              );
              this.eventEmitter.emit('filing.changed', {
                action: params.action,
                filingId: result?.id || params.args.where?.id,
                filing: filingData,
                affectedUserIds,
                timestamp: new Date().toISOString(),
              });
            } else {
              console.warn(
                '[PrismaService] EventEmitter not set - cannot emit filing.changed event',
              );
            }
          } catch (error) {
            // Log error but don't interrupt the operation
            console.error('Error emitting filing change event:', error);
          }
        }

        return result;
      }

      return next(params);
    });
  }

  setEventEmitter(eventEmitter: EventEmitter2) {
    this.eventEmitter = eventEmitter;
  }

  async onModuleInit() {
    // Temporary logging to debug connection
    console.log('[PrismaService] Connecting with DATABASE_URL:', process.env.DATABASE_URL);
    console.log('[PrismaService] DIRECT_URL:', process.env.DIRECT_URL);
    
    await this.$connect();

    // Set timezone for all database connections to Asia/Manila
    try {
      await this.$executeRaw`SET timezone = 'Asia/Manila'`;
      console.log('[PrismaService] Database timezone set to Asia/Manila');
    } catch (error) {
      console.warn(
        '[PrismaService] Could not set database timezone to Asia/Manila:',
        error,
      );
    }
  }
}
