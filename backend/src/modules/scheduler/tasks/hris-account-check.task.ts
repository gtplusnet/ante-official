import { Injectable } from '@nestjs/common';
import { BaseTask } from './base.task';
import { PrismaService } from '@common/prisma.service';
import { AccountActionMongoService } from '@modules/hr/action-center/mongodb/account-action-mongo.service';
import {
  ActionCheckType,
  ActionIssueType,
} from '@modules/hr/action-center/mongodb/account-action-mongo.schema';

interface AccountCheckResult {
  accountId: string;
  employeeName: string;
  employeeCode?: string;
  checkType: ActionCheckType;
  issueType: ActionIssueType;
  priority: number;
  description: string;
  metadata?: Record<string, any>;
  daysUntilExpiry?: number;
  daysSinceExpiry?: number;
}

interface ExecutionDetail {
  phase: string;
  message: string;
  data?: any;
  timestamp: Date;
}

@Injectable()
export class HrisAccountCheckTask extends BaseTask {
  private executionDetails: ExecutionDetail[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly accountActionService: AccountActionMongoService,
  ) {
    super();
  }

  private addExecutionDetail(phase: string, message: string, data?: any) {
    const detail: ExecutionDetail = {
      phase,
      message,
      data,
      timestamp: new Date(),
    };
    this.executionDetails.push(detail);
    this.logger.log(`[${phase}] ${message}`);
  }

  async execute(config: Record<string, any>): Promise<string> {
    const startTime = Date.now();
    this.executionDetails = []; // Reset details
    await this.logStart();

    this.addExecutionDetail('INITIALIZATION', 'Starting HRIS account check', {
      config,
      startTime: new Date(startTime),
    });

    try {
      const batchSize = config.batchSize || 100;
      const processInterval = config.processInterval || 5000;
      const checks = config.checks || { contracts: true, leaves: false };

      let processedCount = 0;
      let issuesFound = 0;
      let offset = 0;
      let batchNumber = 0;
      const issuesByType: Record<string, number> = {};
      const issuesByPriority: Record<string, number> = {};

      while (true) {
        batchNumber++;
        const batchStartTime = Date.now();

        // Fetch batch of active accounts with employee data
        const accounts = await this.fetchAccountBatch(offset, batchSize);

        if (accounts.length === 0) {
          this.addExecutionDetail(
            'FETCH_BATCH',
            'No more accounts to process',
            {
              batchNumber,
              offset,
            },
          );
          break;
        }

        this.addExecutionDetail(
          'FETCH_BATCH',
          `Processing batch ${batchNumber}`,
          {
            batchNumber,
            batchSize: accounts.length,
            offset,
          },
        );

        const actionItems: AccountCheckResult[] = [];
        const batchIssuesByType: Record<string, number> = {};

        for (const account of accounts) {
          const accountName = `${account.firstName} ${account.lastName}`;

          // Run contract checks
          if (checks.contracts) {
            const contractIssues = await this.checkContractStatus(account);
            if (contractIssues.length > 0) {
              this.addExecutionDetail(
                'ISSUE_FOUND',
                `Found ${contractIssues.length} issue(s) for ${accountName}`,
                {
                  accountId: account.id,
                  employeeName: accountName,
                  employeeCode: account.employeeCode,
                  issues: contractIssues.map((issue) => ({
                    type: issue.issueType,
                    priority: issue.priority,
                    description: issue.description,
                  })),
                },
              );

              // Track issues by type and priority
              contractIssues.forEach((issue) => {
                issuesByType[issue.issueType] =
                  (issuesByType[issue.issueType] || 0) + 1;
                issuesByPriority[issue.priority] =
                  (issuesByPriority[issue.priority] || 0) + 1;
                batchIssuesByType[issue.issueType] =
                  (batchIssuesByType[issue.issueType] || 0) + 1;
              });
            }
            actionItems.push(...contractIssues);
          }

          // Future: Add leave checks
          if (checks.leaves) {
            // const leaveIssues = await this.checkLeaveStatus(account);
            // actionItems.push(...leaveIssues);
          }
        }

        // Bulk upsert action items
        if (actionItems.length > 0) {
          await this.accountActionService.bulkUpsert(actionItems);
          issuesFound += actionItems.length;

          this.addExecutionDetail(
            'BULK_UPSERT',
            `Saved ${actionItems.length} action items to database`,
            {
              batchNumber,
              itemsCount: actionItems.length,
            },
          );
        }

        // Clear resolved items for accounts that no longer have issues
        const accountIds = accounts.map((a) => a.id);

        for (const accountId of accountIds) {
          const accountIssues = actionItems.filter(
            (item) => item.accountId === accountId,
          );
          if (accountIssues.length === 0) {
            // No issues found, clear any existing ones
            await this.accountActionService.clearResolvedByAccount(
              accountId,
              ActionCheckType.CONTRACT,
            );
          }
        }

        processedCount += accounts.length;
        offset += batchSize;

        const batchDuration = Date.now() - batchStartTime;
        this.addExecutionDetail(
          'BATCH_COMPLETE',
          `Completed batch ${batchNumber}`,
          {
            batchNumber,
            accountsProcessed: accounts.length,
            issuesFound: actionItems.length,
            batchDuration,
            issuesByType: batchIssuesByType,
          },
        );

        // Add delay between batches to avoid overloading
        if (processInterval > 0 && accounts.length === batchSize) {
          await new Promise((resolve) => setTimeout(resolve, processInterval));
        }
      }

      const duration = Date.now() - startTime;

      // Create summary
      const summary = {
        duration,
        durationFormatted: this.formatDuration(duration),
        totalAccounts: processedCount,
        totalIssues: issuesFound,
        totalBatches: batchNumber,
        issuesByType: this.sortByValue(issuesByType),
        issuesByPriority: this.getPriorityBreakdown(issuesByPriority),
        performanceMetrics: {
          avgTimePerAccount:
            processedCount > 0 ? Math.round(duration / processedCount) : 0,
          avgTimePerBatch:
            batchNumber > 0 ? Math.round(duration / batchNumber) : 0,
          issueRate:
            processedCount > 0
              ? ((issuesFound / processedCount) * 100).toFixed(2) + '%'
              : '0%',
        },
      };

      this.addExecutionDetail(
        'SUMMARY',
        'HRIS account check completed',
        summary,
      );
      await this.logComplete(duration);

      // Return detailed execution log
      return JSON.stringify(this.executionDetails, null, 2);
    } catch (error) {
      this.addExecutionDetail(
        'FATAL_ERROR',
        'Fatal error in HRIS account check',
        {
          error: error.message,
          stack: error.stack,
        },
      );
      await this.logError(error);
      throw error;
    }
  }

  private async fetchAccountBatch(
    offset: number,
    limit: number,
  ): Promise<any[]> {
    return this.prisma.$queryRaw`
      SELECT 
        a.id,
        a."firstName",
        a."lastName",
        a."isDeleted",
        a.status,
        e."employeeCode",
        e."isActive" as "employeeActive",
        e."activeContractId",
        c.id as "contractId",
        c."endDate" as "contractEndDate",
        c."isActive" as "contractActive"
      FROM "Account" a
      LEFT JOIN "EmployeeData" e ON a.id = e."accountId"
      LEFT JOIN "EmployeeContract" c ON c.id = e."activeContractId"
      WHERE a."isDeleted" = false 
        AND (e."isActive" = true OR e."isActive" IS NULL)
      ORDER BY a.id
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  private async checkContractStatus(
    account: any,
  ): Promise<AccountCheckResult[]> {
    const results: AccountCheckResult[] = [];
    const employeeName = `${account.firstName} ${account.lastName}`;

    // Check if employee data exists
    if (!account.employeeCode) {
      results.push({
        accountId: account.id,
        employeeName,
        checkType: ActionCheckType.CONTRACT,
        issueType: ActionIssueType.NO_EMPLOYEE_DATA,
        priority: 2,
        description: 'Account has no employee data configured',
      });
      return results;
    }

    // Check contract status
    if (!account.contractId || !account.contractActive) {
      results.push({
        accountId: account.id,
        employeeName,
        employeeCode: account.employeeCode,
        checkType: ActionCheckType.CONTRACT,
        issueType: ActionIssueType.NO_CONTRACT,
        priority: 2,
        description: 'Employee has no active contract',
      });
      return results;
    }

    // Check contract expiration
    if (account.contractEndDate) {
      const endDate = new Date(account.contractEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        // Contract expired
        results.push({
          accountId: account.id,
          employeeName,
          employeeCode: account.employeeCode,
          checkType: ActionCheckType.CONTRACT,
          issueType: ActionIssueType.CONTRACT_EXPIRED,
          priority: 1,
          description: `Contract expired ${Math.abs(diffDays)} days ago`,
          daysSinceExpiry: Math.abs(diffDays),
          metadata: {
            contractEndDate: account.contractEndDate,
          },
        });
      } else if (diffDays <= 3) {
        // Expiring in 3 days
        results.push({
          accountId: account.id,
          employeeName,
          employeeCode: account.employeeCode,
          checkType: ActionCheckType.CONTRACT,
          issueType: ActionIssueType.CONTRACT_EXPIRING_3D,
          priority: 1,
          description: `Contract expiring in ${diffDays} days`,
          daysUntilExpiry: diffDays,
          metadata: {
            contractEndDate: account.contractEndDate,
          },
        });
      } else if (diffDays <= 7) {
        // Expiring in 7 days
        results.push({
          accountId: account.id,
          employeeName,
          employeeCode: account.employeeCode,
          checkType: ActionCheckType.CONTRACT,
          issueType: ActionIssueType.CONTRACT_EXPIRING_7D,
          priority: 2,
          description: `Contract expiring in ${diffDays} days`,
          daysUntilExpiry: diffDays,
          metadata: {
            contractEndDate: account.contractEndDate,
          },
        });
      } else if (diffDays <= 30) {
        // Expiring in 30 days
        results.push({
          accountId: account.id,
          employeeName,
          employeeCode: account.employeeCode,
          checkType: ActionCheckType.CONTRACT,
          issueType: ActionIssueType.CONTRACT_EXPIRING_30D,
          priority: 3,
          description: `Contract expiring in ${diffDays} days`,
          daysUntilExpiry: diffDays,
          metadata: {
            contractEndDate: account.contractEndDate,
          },
        });
      }
    }

    return results;
  }

  getName(): string {
    return 'hris-account-check';
  }

  getDescription(): string {
    return 'Checks employee accounts for contract issues and other HRIS-related problems';
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  private sortByValue(obj: Record<string, number>): Record<string, number> {
    return Object.entries(obj)
      .sort(([, a], [, b]) => b - a)
      .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
  }

  private getPriorityBreakdown(
    priorityCounts: Record<string, number>,
  ): Record<string, { count: number; label: string }> {
    const breakdown: Record<string, { count: number; label: string }> = {};

    Object.entries(priorityCounts).forEach(([priority, count]) => {
      let label = 'Unknown';
      if (parseInt(priority) <= 3) label = 'High';
      else if (parseInt(priority) <= 6) label = 'Medium';
      else label = 'Low';

      breakdown[`priority_${priority}`] = {
        count,
        label: `${label} (P${priority})`,
      };
    });

    return breakdown;
  }
}
