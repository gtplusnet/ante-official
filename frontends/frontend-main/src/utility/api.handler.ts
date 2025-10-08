import { LoginRequest, SignUpRequest } from '@shared/request/auth.request';
import { LoginResponse } from '@shared/response/auth.response';
import { AxiosError, AxiosResponse, Method } from 'axios';
import { api } from 'src/boot/axios';
import { handleAxiosError } from './axios.error.handler';
import { QVueGlobals } from 'quasar';
import { ProjectCreateRequest, ProjectEditRequest, TableParams } from "@shared/request";
import { ProjectDataResponse, TableResponse } from "@shared/response";
import { ItemDataResponse } from "@shared/response";
import { PettyCashHolderResponse } from 'src/interfaces/petty-cash.interface';

export const APIRequests = {
  login: (quasar: QVueGlobals, params: LoginRequest) => apiRequest<LoginResponse>(quasar, 'POST', '/auth/login', params),
  signUp: (quasar: QVueGlobals, params: SignUpRequest) => apiRequest<LoginResponse>(quasar, 'POST', '/auth/signup', params),

  // Project API methods
  createProject: (quasar: QVueGlobals, params: ProjectCreateRequest) => apiRequest<ProjectDataResponse>(quasar, 'POST', '/project', params),
  editProject: (quasar: QVueGlobals, params: ProjectEditRequest) => apiRequest<ProjectDataResponse>(quasar, 'PATCH', '/project', params),
  getProjectTable: (quasar: QVueGlobals, params: unknown, query: TableParams) => apiRequest<TableResponse<ProjectDataResponse>>(quasar, 'PUT', '/project', params, query),
  getProjectInformation: (quasar: QVueGlobals, params: unknown) => apiRequest<ProjectDataResponse>(quasar, 'GET', '/project', {}, params),
  deleteProject: (quasar: QVueGlobals, id: string, password: string) => apiRequest<unknown>(quasar, 'DELETE', `/project/${id}`, { password }),
  deleteAllProjects: (quasar: QVueGlobals, password: string) => apiRequest<unknown>(quasar, 'DELETE', '/project', { password }),
  getProjectBoard: (quasar: QVueGlobals, isLead: string) => apiRequest<unknown>(quasar, 'GET', `/project/board?isLead=${isLead}`, {}),
  moveProject: (quasar: QVueGlobals, projectId: string, boardKey: string) => apiRequest<unknown>(quasar, 'PATCH', '/project/move', { projectId, boardKey }),

  // Lead API methods
  createLead: (quasar: QVueGlobals, params: ProjectCreateRequest) => apiRequest<ProjectDataResponse>(quasar, 'POST', '/lead', params),
  editLead: (quasar: QVueGlobals, params: ProjectEditRequest) => apiRequest<ProjectDataResponse>(quasar, 'PATCH', '/lead', params),
  getLeadTable: (quasar: QVueGlobals, params: unknown, query: TableParams) => apiRequest<TableResponse<ProjectDataResponse>>(quasar, 'PUT', '/lead', params, query),
  getLeadInformation: (quasar: QVueGlobals, params: unknown) => apiRequest<ProjectDataResponse>(quasar, 'GET', '/lead', {}, params),
  deleteLead: (quasar: QVueGlobals, id: string, password?: string) => apiRequest<unknown>(quasar, 'DELETE', `/lead/${id}`, password ? { password } : {}),
  deleteAllLeads: (quasar: QVueGlobals, password: string) => apiRequest<unknown>(quasar, 'DELETE', '/lead', { password }),
  getLeadBoard: (quasar: QVueGlobals) => apiRequest<unknown>(quasar, 'PUT', '/lead/board', {}, { isLead: 'true' }),
  moveLead: (quasar: QVueGlobals, projectId: string, boardKey: string) => apiRequest<unknown>(quasar, 'PATCH', '/lead/move', { projectId, boardKey }),
  convertLeadToProject: (quasar: QVueGlobals, id: string) => apiRequest<ProjectDataResponse>(quasar, 'POST', `/lead/${id}/convert`, {}),
  getDealTypesSummary: (quasar: QVueGlobals) => apiRequest<unknown>(quasar, 'GET', '/lead/deal-types-summary', {}, {}),
  getClosingDatesSummary: (quasar: QVueGlobals) => apiRequest<unknown>(quasar, 'GET', '/lead/closing-dates-summary', {}, {}),
  getSalesProbabilitySummary: (quasar: QVueGlobals) => apiRequest<unknown>(quasar, 'GET', '/lead/sales-probability-summary', {}, {}),

  // Item API methods
  deleteItem: (quasar: QVueGlobals, id: string) => apiRequest<ItemDataResponse>(quasar, 'DELETE', `/items/${id}`, {}, {}),
  restoreItem: (quasar: QVueGlobals, id: string) => apiRequest<ItemDataResponse>(quasar, 'PUT', `/item/restore/${id}`, {}, {}),
  // getVariationItem: (quasar: QVueGlobals, id: string) => apiRequest<ItemDataResponse>(quasar, 'POST', '/items/get-variation-item', {}, {}),

  async requestDeveloperPromotionOTP(quasar: QVueGlobals): Promise<void> {
    try {
      const response = await api.post('otp/developer-promotion/request');
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async verifyDeveloperPromotionOTP(quasar: QVueGlobals, otp: string): Promise<void> {
    try {
      const response = await api.post('otp/developer-promotion/verify', { otp });
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async requestGenericOTP(quasar: QVueGlobals, type: string, context: Record<string, unknown> = {}): Promise<void> {
    try {
      const response = await api.post('otp/request', { type, context });
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async verifyGenericOTP(quasar: QVueGlobals, type: string, otp: string, context: Record<string, unknown> = {}): Promise<void> {
    try {
      const response = await api.post('otp/verify', { type, otp, context });
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  // Email Configuration APIs
  async getEmailConfig(quasar: QVueGlobals): Promise<unknown> {
    try {
      const response = await api.get('email-config');
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async createEmailConfig(quasar: QVueGlobals, data: unknown): Promise<unknown> {
    try {
      const response = await api.post('email-config', data);
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async updateEmailConfig(quasar: QVueGlobals, data: unknown): Promise<unknown> {
    try {
      const response = await api.put('email-config', data);
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async deleteEmailConfig(quasar: QVueGlobals): Promise<void> {
    try {
      await api.delete('email-config');
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async testEmailConnection(quasar: QVueGlobals, data: unknown): Promise<{ 
    success: boolean; 
    message: string;
    details?: {
      incoming: { success: boolean; message: string };
      outgoing: { success: boolean; message: string };
    };
  }> {
    try {
      const response = await api.post('email-config/test', data);
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async testSavedEmailConnection(quasar: QVueGlobals): Promise<{ 
    success: boolean; 
    message: string;
    details?: {
      incoming: { success: boolean; message: string };
      outgoing: { success: boolean; message: string };
    };
  }> {
    try {
      const response = await api.post('email-config/test-saved');
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async getEmailProviderPresets(quasar: QVueGlobals, provider: string): Promise<unknown> {
    try {
      const response = await api.get(`email-config/presets/${provider}`);
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  // Email Sending APIs
  async sendEmail(quasar: QVueGlobals, data: { to: string[]; subject: string; html?: string; text?: string; cc?: string[]; bcc?: string[]; attachments?: unknown[] }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('email/send', data);
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async verifyEmailConnection(quasar: QVueGlobals): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.get('email/verify');
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async sendTestEmail(quasar: QVueGlobals): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('email/test');
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  // Email client APIs
  async getEmailFolders(quasar: QVueGlobals): Promise<string[]> {
    try {
      const response = await api.get('email/folders');
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async getEmails(quasar: QVueGlobals, params: { folder?: string; page?: number; limit?: number; search?: string }): Promise<{
    emails: Array<{
      id: string;
      messageId: string;
      from: { name: string; email: string };
      to: Array<{ name?: string; email: string }>;
      cc?: Array<{ name?: string; email: string }>;
      subject: string;
      preview: string;
      body: string;
      date: Date;
      unread: boolean;
      starred: boolean;
      folder: string;
      hasAttachments: boolean;
      attachments?: Array<{
        filename: string;
        size: number;
        contentType: string;
      }>;
    }>;
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const response = await api.get('email/list', { params });
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async getEmail(quasar: QVueGlobals, id: string): Promise<{
    id: string;
    messageId: string;
    from: { name: string; email: string };
    to: Array<{ name?: string; email: string }>;
    cc?: Array<{ name?: string; email: string }>;
    subject: string;
    preview: string;
    body: string;
    date: Date;
    unread: boolean;
    starred: boolean;
    folder: string;
    hasAttachments: boolean;
    attachments?: Array<{
      filename: string;
      size: number;
      contentType: string;
    }>;
  }> {
    try {
      const response = await api.get(`email/${id}`);
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async getUnreadEmailCount(quasar: QVueGlobals): Promise<{ count: number }> {
    try {
      const response = await api.get('email/unread-count');
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async markEmailAsRead(quasar: QVueGlobals, id: string): Promise<{ success: boolean }> {
    try {
      const response = await api.put(`email/${id}/read`);
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async markEmailAsUnread(quasar: QVueGlobals, id: string): Promise<{ success: boolean }> {
    try {
      const response = await api.put(`email/${id}/unread`);
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async starEmail(quasar: QVueGlobals, id: string): Promise<{ success: boolean }> {
    try {
      const response = await api.put(`email/${id}/star`);
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async unstarEmail(quasar: QVueGlobals, id: string): Promise<{ success: boolean }> {
    try {
      const response = await api.put(`email/${id}/unstar`);
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async moveEmail(quasar: QVueGlobals, id: string, folder: string): Promise<{ success: boolean }> {
    try {
      const response = await api.put(`email/${id}/move`, { folder });
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async deleteEmail(quasar: QVueGlobals, id: string): Promise<{ success: boolean }> {
    try {
      const response = await api.delete(`email/${id}`);
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async syncEmails(quasar: QVueGlobals): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('email/sync');
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  // Petty Cash API methods
  getCurrentUserPettyCash: (quasar: QVueGlobals) => apiRequest<PettyCashHolderResponse>(quasar, 'GET', '/petty-cash/holder/current', {}),

  // Government Payment History API methods
  async getGovernmentPaymentHistorySss(quasar: QVueGlobals, params?: { startDate?: string; endDate?: string; accountId?: string }): Promise<{ data: unknown[] }> {
    try {
      const response = await api.get('hr-processing/government-payment-history/sss', { params });
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async getGovernmentPaymentHistoryPhilhealth(quasar: QVueGlobals, params?: { startDate?: string; endDate?: string; accountId?: string }): Promise<{ data: unknown[] }> {
    try {
      const response = await api.get('hr-processing/government-payment-history/philhealth', { params });
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async getGovernmentPaymentHistoryPagibig(quasar: QVueGlobals, params?: { startDate?: string; endDate?: string; accountId?: string }): Promise<{ data: unknown[] }> {
    try {
      const response = await api.get('hr-processing/government-payment-history/pagibig', { params });
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },

  async getGovernmentPaymentHistoryTax(quasar: QVueGlobals, params?: { startDate?: string; endDate?: string; accountId?: string }): Promise<{ data: unknown[] }> {
    try {
      const response = await api.get('hr-processing/government-payment-history/tax', { params });
      return response.data;
    } catch (error) {
      handleAxiosError(quasar, error as AxiosError);
      throw error;
    }
  },
};

const apiRequest = async <T>(quasar: QVueGlobals, method: Method, url: string, params?: unknown, query: unknown = {}): Promise<T> => {
  const queryString = new URLSearchParams(query as Record<string, string>).toString();
  if (queryString) {
    url += '?' + queryString;
  }
  return new Promise<T>((resolve, reject) => {
    api
      .request({
        method,
        url,
        data: params,
      })
      .then((response: AxiosResponse<T>) => {
        resolve(response.data);
      })
      .catch((error: AxiosError) => {
        handleAxiosError(quasar, error);
        reject(error);
      });
  });
};

// Export individual government payment history functions
export const getGovernmentPaymentHistorySSS = APIRequests.getGovernmentPaymentHistorySss;
export const getGovernmentPaymentHistoryPhilhealth = APIRequests.getGovernmentPaymentHistoryPhilhealth;
export const getGovernmentPaymentHistoryPagibig = APIRequests.getGovernmentPaymentHistoryPagibig;
export const getGovernmentPaymentHistoryTax = APIRequests.getGovernmentPaymentHistoryTax;
