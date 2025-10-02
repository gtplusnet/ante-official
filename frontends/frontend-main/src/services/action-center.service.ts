import { api } from 'src/boot/axios';

export interface ActionCenterItem {
  id: string;
  accountId: string;
  employeeName: string;
  employeeCode?: string;
  checkType: 'CONTRACT' | 'LEAVE' | 'DOCUMENT';
  issueType: string;
  priority: number;
  description: string;
  metadata?: Record<string, any>;
  isIgnored: boolean;
  ignoredBy?: string;
  ignoredAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  daysUntilExpiry?: number;
  daysSinceExpiry?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActionCenterStats {
  totalActive: number;
  byPriority: Record<number, number>;
  byCheckType: Record<string, number>;
  recentlyResolved: number;
}

export interface ActionCenterListParams {
  page?: number;
  limit?: number;
  checkType?: string;
  priority?: number;
  isIgnored?: boolean;
  resolved?: boolean;
  search?: string;
}

export interface ActionCenterListResponse {
  data: ActionCenterItem[];
  total: number;
  page: number;
  lastPage: number;
}

class ActionCenterService {

  async getItems(params?: ActionCenterListParams): Promise<ActionCenterListResponse> {
    const response = await api.get('/hr/action-center/items', { params });
    return response.data;
  }

  async getStats(): Promise<ActionCenterStats> {
    const response = await api.get('/hr/action-center/stats');
    return response.data;
  }

  async ignoreItem(id: string): Promise<ActionCenterItem> {
    const response = await api.post(`/hr/action-center/items/${id}/ignore`, {});
    return response.data;
  }

  async resolveItem(id: string, notes?: string): Promise<ActionCenterItem> {
    const response = await api.post(`/hr/action-center/items/${id}/resolve`, { notes });
    return response.data;
  }

  getPriorityLabel(priority: number): string {
    if (priority <= 3) return 'High';
    if (priority <= 6) return 'Medium';
    return 'Low';
  }

  getPriorityColor(priority: number): string {
    if (priority <= 3) return 'negative';
    if (priority <= 6) return 'warning';
    return 'info';
  }

  getIssueTypeLabel(issueType: string): string {
    const labels: Record<string, string> = {
      CONTRACT_EXPIRING_30D: 'Contract expiring soon',
      CONTRACT_EXPIRING_7D: 'Contract expiring in 7 days',
      CONTRACT_EXPIRING_3D: 'Contract expiring in 3 days',
      CONTRACT_EXPIRED: 'Contract expired',
      NO_CONTRACT: 'No active contract',
      NO_EMPLOYEE_DATA: 'No employee data',
      LEAVE_BALANCE_LOW: 'Leave balance low',
      DOCUMENT_EXPIRING: 'Document expiring',
      DOCUMENT_EXPIRED: 'Document expired',
    };
    return labels[issueType] || issueType;
  }
}

export default new ActionCenterService();