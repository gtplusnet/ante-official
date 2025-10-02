import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import { EmployeeTimekeepingTotal, TimekeepingOutputResponse } from '@shared/response/timekeeping.response';
import { EmployeeTimekeepingRequest } from '@shared/request/timekeeping.request';
import { AxiosResponse } from 'axios';

export const useEmployeeTimekeepingStore = defineStore('employee-timekeeping', {
  state: () => ({
    isListLoaded: false,
    employeeAccountId: '' as string,
    cutoffDateRange: '' as string,
    list: [] as TimekeepingOutputResponse[],
    total: {} as EmployeeTimekeepingTotal,
  }),
  getters: {
    getList(): TimekeepingOutputResponse[] {
      return this.list;
    }
  },

  actions: {
    setParams(params: EmployeeTimekeepingRequest): void {
      this.employeeAccountId = params.employeeAccountId;
      this.cutoffDateRange = params.cutoffDateRange;
    },
    startLoading(): void {
      this.isListLoaded = false;
    },
    async requestData() {
      await api.get('/hris/timekeeping/employee', {
        params: {
          employeeAccountId: this.employeeAccountId,
          cutoffDateRange: this.cutoffDateRange,
        },
      }).then((response: AxiosResponse<TimekeepingOutputResponse[]>) => {
        this.list = response.data;
      }).catch((error) => {
        console.error('Error fetching timekeeping data:', error);
      })

      await api.get('/hris/timekeeping/employee/total', {
        params: {
          employeeAccountId: this.employeeAccountId,
          cutoffDateRange: this.cutoffDateRange,
        },
      }).then((response: AxiosResponse<EmployeeTimekeepingTotal>) => {
        this.total = response.data;
      }).catch((error) => {
        console.error('Error fetching timekeeping data total:', error);
      }).finally(() => {
        this.isListLoaded = true;
      });;
    }
  },
});
