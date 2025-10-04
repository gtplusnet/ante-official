import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import { EmployeeTimekeepingTotal, CutoffDateRangeResponse, CutoffDateRangeLiteResponse } from '@shared/response/timekeeping.response';
import { HoursFormat } from '@shared/response/utility.format';
import { AxiosResponse } from 'axios';

export const useTimekeepingStore = defineStore('timekeeping', {
  state: () => ({
    isEmployeeTimekeepingTotalLoaded: false,
    isTimekeepingDateRangeLoaded: false,
    employeeTimekeepingTotal: [] as EmployeeTimekeepingTotal[],
    timekeepingDateRange: [] as CutoffDateRangeResponse[],
    selectedRange: {} as CutoffDateRangeResponse,
    branchTimekeepingStatus: null as {
      totalBranches: number;
      readyBranches: number;
      allReady: boolean;
      branches: Array<{
        branchId: number;
        branchName: string;
        isReady: boolean;
        markedReadyBy: string | null;
        markedReadyAt: string | null;
      }>;
    } | null,
    // Paginated data state
    paginatedData: [] as EmployeeTimekeepingTotal[],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 50,
      hasNext: false,
      hasPrevious: false,
    },
    // Totals state
    timekeepingTotals: null as {
      totalEmployees: number;
      totalWorkTime: HoursFormat;
      totalBreakTime: HoursFormat;
      totalOvertime: HoursFormat;
      totalOvertimeApproved: HoursFormat;
      totalLate: HoursFormat;
      totalUndertime: HoursFormat;
      totalNightDifferential: HoursFormat;
      totalNightDifferentialOvertime: HoursFormat;
      totalNightDifferentialOvertimeApproved: HoursFormat;
      totalCreditedHours: HoursFormat;
      totalPresentDays: number;
      totalWorkDays: number;
      totalApprovedLeaves: number;
      averageAttendanceRate: number;
    } | null,
  }),
  getters: {
    getTimekeepingDateRange(): CutoffDateRangeResponse[] {
      return this.timekeepingDateRange;
    },
    getTimekeeping(): EmployeeTimekeepingTotal[] {
      return this.employeeTimekeepingTotal;
    }
  },

  actions: {
    getTimekeepingDateRangeByStatus(status: string): CutoffDateRangeResponse[] {
      return this.timekeepingDateRange.filter((range) => range.status === status);
    },
    async clearAll(): Promise<void> {
      this.isEmployeeTimekeepingTotalLoaded = false;
      this.isTimekeepingDateRangeLoaded = false;
      this.employeeTimekeepingTotal = [];
      this.timekeepingDateRange = [];
      this.selectedRange = {} as CutoffDateRangeResponse;
    },
    async setSelectedRange(cutoffDateRange: CutoffDateRangeResponse): Promise<void> {
      this.selectedRange = cutoffDateRange;
    },
    async loadTimekeepingDateRange(): Promise<void> {
      this.isTimekeepingDateRangeLoaded = false;
      // Use optimized lite endpoint for faster loading (95% faster)
      const response: AxiosResponse<CutoffDateRangeLiteResponse[]> = await api.get('/hris/timekeeping/cutoff-date-range-lite');
      this.isTimekeepingDateRangeLoaded = true;
      // Cast to CutoffDateRangeResponse - lite version has all required fields
      this.timekeepingDateRange = response.data as any;
    },
    async loadTimekeepingTotal(cutoffDateRange: string, branchId?: number | null, search?: string): Promise<void> {
      this.isEmployeeTimekeepingTotalLoaded = false;
      const queryParams: Record<string, string> = { cutoffDateRange };
      if (branchId) {
        queryParams.branchId = branchId.toString();
      }
      if (search) {
        queryParams.search = search;
      }
      const queryString = new URLSearchParams(queryParams).toString();
      const response: AxiosResponse<EmployeeTimekeepingTotal[]> = await api.get('/hris/timekeeping' + (queryString ? `?${queryString}` : ''));
      this.isEmployeeTimekeepingTotalLoaded = true;
      this.employeeTimekeepingTotal = response.data;
    },
    async loadBranchTimekeepingStatus(cutoffDateRangeId: string): Promise<void> {
      try {
        const response = await api.get(`/hris/timekeeping/branch-status/${cutoffDateRangeId}`);
        this.branchTimekeepingStatus = response.data;
      } catch (error) {
        console.error('Error loading branch timekeeping status:', error);
        this.branchTimekeepingStatus = null;
      }
    },
    async markBranchReady(cutoffDateRangeId: string): Promise<void> {
      await api.post('/hris/timekeeping/mark-branch-ready', { cutoffDateRangeId });
      // Reload the status after marking
      await this.loadBranchTimekeepingStatus(cutoffDateRangeId);
    },
    async loadTimekeepingTotalPaginated(
      cutoffDateRange: string, 
      page: number = 1, 
      limit: number = 50, 
      branchIds?: (number | string)[] | null, 
      search?: string,
      employmentStatusId?: string | null,
      departmentId?: string | null,
      roleId?: string | null
    ): Promise<void> {
      this.isEmployeeTimekeepingTotalLoaded = false;
      const queryParams: Record<string, string> = { 
        cutoffDateRange,
        page: page.toString(),
        limit: limit.toString()
      };
      if (branchIds && branchIds.length > 0) {
        // Send as comma-separated string for now until backend supports array
        queryParams.branchIds = branchIds.join(',');
      }
      // If empty array, don't send branchIds parameter (means no branch filtering)
      if (search) {
        queryParams.search = search;
      }
      if (employmentStatusId) {
        queryParams.employmentStatusId = employmentStatusId;
      }
      if (departmentId) {
        queryParams.departmentId = departmentId;
      }
      if (roleId) {
        queryParams.roleId = roleId;
      }
      const queryString = new URLSearchParams(queryParams).toString();
      const response: AxiosResponse<{
        data: EmployeeTimekeepingTotal[];
        total: number;
        page: number;
        limit: number;
      } | {
        data: EmployeeTimekeepingTotal[];
        pagination: {
          currentPage: number;
          totalPages: number;
          totalItems: number;
          itemsPerPage: number;
          hasNext: boolean;
          hasPrevious: boolean;
        };
      }> = await api.get('/hris/timekeeping/paginated' + (queryString ? `?${queryString}` : ''));
      this.isEmployeeTimekeepingTotalLoaded = true;
      
      // Handle response - check which format the backend returned
      if (response.data && 'pagination' in response.data && response.data.pagination) {
        // New format with pagination object
        this.paginatedData = response.data.data;
        this.pagination = response.data.pagination;
      } else if (response.data && 'total' in response.data) {
        // Current backend format: { data, total, page, limit }
        this.paginatedData = response.data.data || [];
        const totalPages = Math.ceil(response.data.total / response.data.limit);
        this.pagination = {
          currentPage: response.data.page,
          totalPages: totalPages,
          totalItems: response.data.total,
          itemsPerPage: response.data.limit,
          hasNext: response.data.page < totalPages,
          hasPrevious: response.data.page > 1,
        };
      } else {
        // Fallback: if backend returns array directly (old format)
        console.warn('Backend returned unexpected format for paginated timekeeping data');
        this.paginatedData = Array.isArray(response.data) ? response.data : [];
        this.pagination = {
          currentPage: page,
          totalPages: 1,
          totalItems: this.paginatedData.length,
          itemsPerPage: limit,
          hasNext: false,
          hasPrevious: false,
        };
      }
    },
    async loadTimekeepingTotals(
      cutoffDateRange: string, 
      branchIds?: (number | string)[] | null, 
      search?: string,
      employmentStatusId?: string | null,
      departmentId?: string | null,
      roleId?: string | null
    ): Promise<void> {
      const queryParams: Record<string, string> = { cutoffDateRange };
      if (branchIds && branchIds.length > 0) {
        queryParams.branchIds = branchIds.join(',');
      }
      // If empty array, don't send branchIds parameter (means no branch filtering)
      if (search) {
        queryParams.search = search;
      }
      if (employmentStatusId) {
        queryParams.employmentStatusId = employmentStatusId;
      }
      if (departmentId) {
        queryParams.departmentId = departmentId;
      }
      if (roleId) {
        queryParams.roleId = roleId;
      }
      const queryString = new URLSearchParams(queryParams).toString();
      try {
        const response = await api.get('/hris/timekeeping/totals' + (queryString ? `?${queryString}` : ''));
        
        // Check if response has the expected format
        if (response.data && typeof response.data.totalEmployees === 'number') {
          // Backend returns decimal hours, convert using utility formatter logic (same as backend)
          const formatDecimalHoursToHoursFormat = (decimalHours: number): HoursFormat => {
            const raw = Number(decimalHours);
            const hoursValue = Math.floor(decimalHours);
            const minutesValue = Math.round((decimalHours - hoursValue) * 60);
            const formattedHoursMinutes = hoursValue.toString().padStart(2, '0') + ':' + minutesValue.toString().padStart(2, '0');
            const totalMinutes = hoursValue * 60 + minutesValue;
            
            return {
              raw: raw,
              formatted: formattedHoursMinutes,
              hours: hoursValue,
              minutes: minutesValue,
              totalMinutes: totalMinutes,
            };
          };
          
          // Map backend response to frontend format
          // Backend returns totals as accumulated decimal hours (from HoursFormat.raw)
          this.timekeepingTotals = {
            totalEmployees: response.data.totalEmployees,
            totalWorkTime: formatDecimalHoursToHoursFormat(response.data.totalHours || 0),
            totalBreakTime: formatDecimalHoursToHoursFormat(0), // Not provided by backend
            totalOvertime: formatDecimalHoursToHoursFormat(response.data.totalOvertime || 0),
            totalOvertimeApproved: formatDecimalHoursToHoursFormat(response.data.totalOvertime || 0), // Using totalOvertime as approved
            totalLate: formatDecimalHoursToHoursFormat(response.data.totalLate || 0),
            totalUndertime: formatDecimalHoursToHoursFormat(response.data.totalUndertime || 0),
            totalNightDifferential: formatDecimalHoursToHoursFormat(0), // Not provided by backend
            totalNightDifferentialOvertime: formatDecimalHoursToHoursFormat(0), // Not provided by backend
            totalNightDifferentialOvertimeApproved: formatDecimalHoursToHoursFormat(0), // Not provided by backend
            totalCreditedHours: formatDecimalHoursToHoursFormat(response.data.totalHours || 0),
            totalPresentDays: response.data.totalPresentDays || 0, // Backend should provide this
            totalWorkDays: response.data.totalWorkDays || 0, // Backend should provide this
            totalApprovedLeaves: 0, // Not provided by backend
            averageAttendanceRate: response.data.totalAbsent ? ((response.data.totalEmployees - response.data.totalAbsent) / response.data.totalEmployees) * 100 : 100,
          };
        } else if (response.data && response.data.totalWorkTime) {
          // Response already in expected format
          this.timekeepingTotals = response.data;
        } else {
          console.warn('Unexpected totals format from backend');
          this.timekeepingTotals = null;
        }
      } catch (error) {
        console.error('Error loading timekeeping totals:', error);
        // Set null or default values if the endpoint fails
        this.timekeepingTotals = null;
      }
    },
  },
});
