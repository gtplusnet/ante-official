import { api } from 'src/boot/axios';

// Use the actual backend response format
export interface CutoffDateRangeResponse {
  key: string;
  label: string;
  startDate: {
    raw: string;
    dateFull: string;
    dateStandard: string;
  };
  endDate: {
    raw: string;
    dateFull: string;
    dateStandard: string;
  };
  processingDate: {
    raw: string;
    dateFull: string;
    dateStandard: string;
  };
  cutoffId: number;
  cutoffCode: string;
  status: string;
  isActive: boolean;
  dateRangeStatus: 'Past Due' | 'Current' | 'On Process';
  totalNetPay: {
    amount: number;
    formatCurrency: string;
  };
  totalGrossPay: {
    amount: number;
    formatCurrency: string;
  };
  totalBasicPay: {
    amount: number;
    formatCurrency: string;
  };
  totalBasicSalary: {
    amount: number;
    formatCurrency: string;
  };
}

export interface PayrollMonthlyData {
  month: string;
  amount: number;
  startDate: Date;
  cutoffCount: number;
}

export interface PayrollSummaryData {
  monthlyData: PayrollMonthlyData[];
  currentYearTotal: number;
  previousYearTotal: number;
  percentageChange: number;
  isPositive: boolean;
  lastUpdated: Date;
}

export class DashboardPayrollService {
  private static readonly baseUrl = '/hr-processing';
  private static cache: { data: PayrollSummaryData | null; timestamp: number } = {
    data: null,
    timestamp: 0,
  };
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Get posted payroll data grouped by start date
   */
  static async getPayrollSummary(): Promise<PayrollSummaryData> {
    try {
      
      // Check cache first
      const now = Date.now();
      if (this.cache.data && (now - this.cache.timestamp) < this.CACHE_DURATION) {
        return this.cache.data;
      }

      // Fetch posted cutoffs
      const response = await api.get(`${this.baseUrl}/get-cutoff-list`, {
        params: { status: 'POSTED' }
      });

      const postedCutoffs: CutoffDateRangeResponse[] = response.data;
      
      // Debug: Log all cutoffs with their amounts
      
      // Process the data
      const summaryData = this.processPayrollData(postedCutoffs);
      
      // Update cache
      this.cache.data = summaryData;
      this.cache.timestamp = now;
      
      return summaryData;
    } catch (error) {
      console.error('Failed to fetch payroll summary:', error);
      
      // Return cached data if available, otherwise empty data
      if (this.cache.data) {
        return this.cache.data;
      }
      
      return this.getEmptyPayrollSummary();
    }
  }

  /**
   * Process posted cutoffs and group by start date month
   */
  private static processPayrollData(cutoffs: CutoffDateRangeResponse[]): PayrollSummaryData {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // Filter cutoffs by current and previous year based on start date
    const currentYearCutoffs = cutoffs.filter(cutoff => {
      const startYear = new Date(cutoff.startDate.raw).getFullYear();
      return startYear === currentYear;
    });

    const previousYearCutoffs = cutoffs.filter(cutoff => {
      const startYear = new Date(cutoff.startDate.raw).getFullYear();
      return startYear === previousYear;
    });
    

    // Group current year data by month
    const currentYearMonthly = this.groupByStartDateMonth(currentYearCutoffs);

    // Calculate totals (handle null amounts - parse from formatCurrency if needed)
    const currentYearTotal = currentYearCutoffs.reduce((sum, cutoff) => {
      let amount = cutoff.totalNetPay.amount;
      if (amount === undefined || amount === null) {
        const formatCurrency = cutoff.totalNetPay.formatCurrency;
        if (formatCurrency) {
          const numericMatch = formatCurrency.replace(/[₱,\s]/g, '');
          amount = parseFloat(numericMatch) || 0;
        } else {
          amount = 0;
        }
      }
      return sum + amount;
    }, 0);
    
    const previousYearTotal = previousYearCutoffs.reduce((sum, cutoff) => {
      let amount = cutoff.totalNetPay.amount;
      if (amount === undefined || amount === null) {
        const formatCurrency = cutoff.totalNetPay.formatCurrency;
        if (formatCurrency) {
          const numericMatch = formatCurrency.replace(/[₱,\s]/g, '');
          amount = parseFloat(numericMatch) || 0;
        } else {
          amount = 0;
        }
      }
      return sum + amount;
    }, 0);

    // Calculate percentage change
    const percentageChange = previousYearTotal > 0 
      ? ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100 
      : 0;

    // Generate complete monthly data (fill missing months with 0)
    const monthlyData = this.generateCompleteMonthlyData(currentYearMonthly, currentYear);

    return {
      monthlyData,
      currentYearTotal,
      previousYearTotal,
      percentageChange,
      isPositive: percentageChange >= 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Group cutoffs by start date month
   */
  private static groupByStartDateMonth(cutoffs: CutoffDateRangeResponse[]): Map<number, PayrollMonthlyData> {
    const monthlyMap = new Map<number, PayrollMonthlyData>();

    cutoffs.forEach(cutoff => {
      const startDate = new Date(cutoff.startDate.raw);
      const month = startDate.getMonth(); // 0-11
      const monthName = startDate.toLocaleDateString('en', { month: 'short' });

      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, {
          month: monthName,
          amount: 0,
          startDate,
          cutoffCount: 0,
        });
      }

      const monthData = monthlyMap.get(month)!;
      // Handle null amounts safely - parse from formatCurrency if amount is undefined
      let amount = cutoff.totalNetPay.amount;
      if (amount === undefined || amount === null) {
        // Parse amount from formatCurrency string (e.g., "₱ 866.24" -> 866.24)
        const formatCurrency = cutoff.totalNetPay.formatCurrency;
        if (formatCurrency) {
          const numericMatch = formatCurrency.replace(/[₱,\s]/g, '');
          amount = parseFloat(numericMatch) || 0;
        } else {
          amount = 0;
        }
      }
      monthData.amount += amount;
      monthData.cutoffCount += 1;
    });

    return monthlyMap;
  }

  /**
   * Generate complete monthly data for all 12 months
   */
  private static generateCompleteMonthlyData(
    monthlyMap: Map<number, PayrollMonthlyData>, 
    year: number
  ): PayrollMonthlyData[] {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return months.map((monthName, index) => {
      const existingData = monthlyMap.get(index);
      return existingData || {
        month: monthName,
        amount: 0,
        startDate: new Date(year, index, 1),
        cutoffCount: 0,
      };
    });
  }

  /**
   * Get empty payroll summary for error states
   */
  private static getEmptyPayrollSummary(): PayrollSummaryData {
    const currentYear = new Date().getFullYear();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return {
      monthlyData: months.map((month, index) => ({
        month,
        amount: 0,
        startDate: new Date(currentYear, index, 1),
        cutoffCount: 0,
      })),
      currentYearTotal: 0,
      previousYearTotal: 0,
      percentageChange: 0,
      isPositive: false,
      lastUpdated: new Date(),
    };
  }

  /**
   * Clear cache (useful for manual refresh)
   */
  static clearCache(): void {
    this.cache.data = null;
    this.cache.timestamp = 0;
  }

  /**
   * Check if data is cached and fresh
   */
  static isCached(): boolean {
    const now = Date.now();
    return this.cache.data !== null && (now - this.cache.timestamp) < this.CACHE_DURATION;
  }
}