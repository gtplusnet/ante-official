import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountActionMongoService } from './mongodb/account-action-mongo.service';
import { AccountService } from '@modules/account/account/account.service';
import { ActionCenterItem, ActionCenterStats } from './action-center.interface';
import { ActionCheckType } from './mongodb/account-action-mongo.schema';

@Injectable()
export class ActionCenterService {
  constructor(
    private readonly accountActionService: AccountActionMongoService,
    private readonly accountService: AccountService,
  ) {}

  async getItems(
    page: number,
    limit: number,
    filters: {
      checkType?: ActionCheckType;
      priority?: number;
      isIgnored?: boolean;
      resolved?: boolean;
      search?: string;
    },
  ): Promise<{
    data: ActionCenterItem[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const result = await this.accountActionService.paginate(
      page,
      limit,
      filters,
    );

    const data: ActionCenterItem[] = result.data.map((doc) => ({
      id: doc._id.toString(),
      accountId: doc.accountId,
      employeeName: doc.employeeName,
      employeeCode: doc.employeeCode,
      checkType: doc.checkType,
      issueType: doc.issueType,
      priority: doc.priority,
      description: doc.description,
      metadata: doc.metadata,
      isIgnored: doc.isIgnored,
      ignoredBy: doc.ignoredBy,
      ignoredAt: doc.ignoredAt,
      resolvedAt: doc.resolvedAt,
      resolvedBy: doc.resolvedBy,
      resolutionNotes: doc.resolutionNotes,
      daysUntilExpiry: doc.daysUntilExpiry,
      daysSinceExpiry: doc.daysSinceExpiry,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return {
      data,
      total: result.total,
      page: result.page,
      lastPage: result.lastPage,
    };
  }

  async getStats(): Promise<ActionCenterStats> {
    return this.accountActionService.getStats();
  }

  async ignoreItem(id: string, ignoredBy: string): Promise<ActionCenterItem> {
    // Verify the account exists
    const account = await this.accountService.getAccountInformation({
      id: ignoredBy,
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const result = await this.accountActionService.ignoreAction(id, ignoredBy);
    if (!result) {
      throw new NotFoundException('Action item not found');
    }

    return this.formatActionItem(result);
  }

  async resolveItem(
    id: string,
    resolvedBy: string,
    notes?: string,
  ): Promise<ActionCenterItem> {
    // Verify the account exists
    const account = await this.accountService.getAccountInformation({
      id: resolvedBy,
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const result = await this.accountActionService.resolveAction(
      id,
      resolvedBy,
      notes,
    );
    if (!result) {
      throw new NotFoundException('Action item not found');
    }

    return this.formatActionItem(result);
  }

  private formatActionItem(doc: any): ActionCenterItem {
    return {
      id: doc._id.toString(),
      accountId: doc.accountId,
      employeeName: doc.employeeName,
      employeeCode: doc.employeeCode,
      checkType: doc.checkType,
      issueType: doc.issueType,
      priority: doc.priority,
      description: doc.description,
      metadata: doc.metadata,
      isIgnored: doc.isIgnored,
      ignoredBy: doc.ignoredBy,
      ignoredAt: doc.ignoredAt,
      resolvedAt: doc.resolvedAt,
      resolvedBy: doc.resolvedBy,
      resolutionNotes: doc.resolutionNotes,
      daysUntilExpiry: doc.daysUntilExpiry,
      daysSinceExpiry: doc.daysSinceExpiry,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
