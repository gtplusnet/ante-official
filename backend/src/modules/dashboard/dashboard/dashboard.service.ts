import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  EmployeePayslipSummary,
  EmployeePayslipsResponse,
  DashboardOverview,
  HRMetrics,
  ProjectMetrics,
  FinanceMetrics,
  InventoryMetrics,
  EmployeeDashboardCounters,
  LeaveBalance,
  EmployeeCutoffDateRange,
  EmployeeCutoffDateRangesResponse,
  AttendanceRecord,
  EmployeeAttendanceResponse,
  AttendanceCalendarDay,
  EmployeeAttendanceCalendarResponse,
} from './dashboard.interface';
import { CutoffDateRangeStatus, Prisma } from '@prisma/client';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';

@Injectable()
export class DashboardService {
  @Inject() private readonly prismaService: PrismaService;
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly employeeListService: EmployeeListService;

  /**
   * Get employee payslips for dashboard widget
   * Only returns POSTED cutoffs where the employee has salary computation
   */
  async getEmployeePayslips(
    accountId: string,
    page = 1,
    limit = 10,
    startDate?: string,
    endDate?: string,
  ): Promise<EmployeePayslipsResponse> {
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.EmployeeTimekeepingCutoffWhereInput = {
      accountId,
      cutoffDateRange: {
        status: CutoffDateRangeStatus.POSTED,
        cutoff: {
          companyId: this.utilityService.companyId,
        },
      },
    };

    // Add date filters if provided
    if (startDate || endDate) {
      const dateFilters: any = {};
      if (startDate) {
        dateFilters.startDate = { gte: new Date(startDate) };
      }
      if (endDate) {
        dateFilters.endDate = { lte: new Date(endDate) };
      }
      whereClause.cutoffDateRange = {
        ...whereClause.cutoffDateRange,
        ...dateFilters,
      };
    }

    // Get total count
    const total = await this.prismaService.employeeTimekeepingCutoff.count({
      where: whereClause,
    });

    // Get employee timekeeping cutoffs with salary computation
    const employeeTimekeepingCutoffs =
      await this.prismaService.employeeTimekeepingCutoff.findMany({
        where: whereClause,
        include: {
          cutoffDateRange: {
            include: {
              cutoff: true,
            },
          },
          EmployeeSalaryComputation: {
            select: {
              grossPay: true,
              netPay: true,
              totalDeduction: true,
              totalGovernmentContribution: true,
            },
          },
        },
        orderBy: {
          cutoffDateRange: {
            endDate: 'desc',
          },
        },
        skip,
        take: limit,
      });

    // Transform data to response format
    const payslips: EmployeePayslipSummary[] = employeeTimekeepingCutoffs
      .filter((etc) => etc.EmployeeSalaryComputation)
      .map((etc) => {
        const salaryComputation = etc.EmployeeSalaryComputation!;
        const cutoffDateRange = etc.cutoffDateRange;
        const cutoff = cutoffDateRange.cutoff;

        // Calculate total deductions
        const totalDeductions =
          (salaryComputation.totalDeduction || 0) +
          (salaryComputation.totalGovernmentContribution || 0);

        return {
          id: etc.id,
          cutoffDateRangeId: cutoffDateRange.id,
          employeeTimekeepingCutoffId: etc.id,
          cutOffPeriod: `${this.formatDate(cutoffDateRange.startDate)} - ${this.formatDate(cutoffDateRange.endDate)}`,
          payrollDate: this.formatDate(cutoffDateRange.processingDate),
          startDate: cutoffDateRange.startDate,
          endDate: cutoffDateRange.endDate,
          cutoffCode: cutoff.cutoffCode || '',
          grossPay: salaryComputation.grossPay || 0,
          netPay: salaryComputation.netPay || 0,
          totalDeductions,
          processDate: cutoffDateRange.processingDate,
        };
      });

    return {
      payslips,
      total,
      page,
      limit,
    };
  }

  /**
   * Get dashboard overview statistics
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    const [employeeCount, activeProjects, pendingApprovals, todayAttendance] =
      await Promise.all([
        this.getActiveEmployeeCount(),
        this.getActiveProjectCount(),
        this.getPendingApprovalsCount(),
        this.getTodayAttendanceCount(),
      ]);

    return {
      employeeCount,
      activeProjects,
      pendingApprovals,
      todayAttendance,
    };
  }

  /**
   * Get HR metrics for dashboard
   */
  async getHRMetrics(): Promise<HRMetrics> {
    // Implementation for HR metrics
    // This would aggregate data from various HR modules
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      inactiveEmployees: 0,
      pendingFilings: 0,
      approvedFilings: 0,
      rejectedFilings: 0,
      todayPresent: 0,
      todayAbsent: 0,
      todayOnLeave: 0,
    };
  }

  /**
   * Get project metrics for dashboard
   */
  async getProjectMetrics(): Promise<ProjectMetrics> {
    // Implementation for project metrics
    return {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      pendingProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
    };
  }

  /**
   * Get finance metrics for dashboard
   */
  async getFinanceMetrics(): Promise<FinanceMetrics> {
    // Implementation for finance metrics
    return {
      totalReceivables: 0,
      totalPayables: 0,
      cashOnHand: 0,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
    };
  }

  /**
   * Get inventory metrics for dashboard
   */
  async getInventoryMetrics(): Promise<InventoryMetrics> {
    // Implementation for inventory metrics
    return {
      totalItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      pendingOrders: 0,
      completedOrders: 0,
    };
  }

  // Helper methods
  private async getActiveEmployeeCount(): Promise<number> {
    // Use the employee list service to get count
    return 0; // Placeholder - should be implemented with actual employee count logic
  }

  private async getActiveProjectCount(): Promise<number> {
    return this.prismaService.project.count({
      where: {
        companyId: this.utilityService.companyId,
        // Adjust based on actual project status enum
      },
    });
  }

  private async getPendingApprovalsCount(): Promise<number> {
    // Count pending approvals across different modules
    return 0; // Placeholder implementation
  }

  private async getTodayAttendanceCount(): Promise<number> {
    // Placeholder - implement actual attendance count logic
    return 0;
  }

  private formatDate(date: Date): string {
    const dateFormat = this.utilityService.formatDate(date);
    return dateFormat.dateFull; // Returns "MMMM D, YYYY" format
  }

  /**
   * Get dashboard counters for the current employee
   */
  async getEmployeeDashboardCounters(
    accountId: string,
  ): Promise<EmployeeDashboardCounters> {
    // Get outstanding requests (pending payroll filings for the user)
    const outstandingRequests = await this.prismaService.payrollFiling.count({
      where: {
        accountId,
        status: 'PENDING',
      },
    });

    // Get days before cutoff based on employee's payroll group
    const daysBeforeCutoff = await this.getEmployeeDaysBeforeCutoff(accountId);

    // Get combined leave balance (SL + VL)
    const leaveBalance = await this.getCombinedLeaveBalance(accountId);

    // Get all tasks count assigned to the employee
    const allTasks = await this.getEmployeeTasksCount(accountId);

    return {
      outstandingRequests,
      daysBeforeCutoff,
      leaveBalance,
      allTasks,
    };
  }

  /**
   * Calculate days before cutoff for a specific employee based on their payroll group
   */
  private async getEmployeeDaysBeforeCutoff(
    accountId: string,
  ): Promise<number | null> {
    try {
      // Get employee with payroll group
      const employeeData = await this.prismaService.employeeData.findFirst({
        where: { accountId },
        include: {
          payrollGroup: {
            include: {
              cutoff: true,
            },
          },
        },
      });

      // Check if employee has proper setup
      if (!employeeData?.payrollGroup?.cutoff?.id) {
        return null;
      }

      // Get active cutoff date range for the employee's cutoff
      const currentDate = new Date();
      const activeCutoff = await this.prismaService.cutoffDateRange.findFirst({
        where: {
          cutoffId: employeeData.payrollGroup.cutoff.id,
          startDate: { lte: currentDate },
          endDate: { gte: currentDate },
          status: {
            in: ['TIMEKEEPING', 'PENDING', 'PROCESSED', 'APPROVED', 'POSTED'],
          },
        },
        orderBy: {
          endDate: 'asc',
        },
      });

      if (!activeCutoff) {
        return null;
      }

      // Calculate days remaining
      const daysRemaining = Math.ceil(
        (activeCutoff.endDate.getTime() - currentDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return Math.max(0, daysRemaining);
    } catch (error) {
      console.error('Error calculating days before cutoff:', error);
      return null;
    }
  }

  /**
   * Get employee's leave balance for a specific leave type
   */
  private async getEmployeeLeaveBalance(
    accountId: string,
    leaveType: 'sick' | 'vacation',
  ): Promise<LeaveBalance | null> {
    try {
      // Get employee leave plans that match the leave type
      const employeeLeavePlans =
        await this.prismaService.employeeLeavePlan.findMany({
          where: {
            accountId,
            leavePlan: {
              leaveTypeConfiguration: {
                name: {
                  contains: leaveType,
                  mode: 'insensitive',
                },
              },
            },
            isActive: true,
          },
          include: {
            leavePlan: {
              include: {
                leaveTypeConfiguration: true,
              },
            },
          },
        });

      if (employeeLeavePlans.length === 0) {
        return null;
      }

      // Get the first matching leave plan (in case there are multiple)
      const employeeLeavePlan = employeeLeavePlans[0];

      // Calculate used and total from the employee leave plan itself
      const total = Number(employeeLeavePlan.totalAnnualCredits || 0);
      const used = Number(employeeLeavePlan.usedCredits || 0);

      return {
        used,
        total,
      };
    } catch (error) {
      console.error(`Error getting ${leaveType} leave balance:`, error);
      return null;
    }
  }

  /**
   * Get combined leave balance (Sick Leave + Vacation Leave)
   */
  private async getCombinedLeaveBalance(
    accountId: string,
  ): Promise<LeaveBalance | null> {
    try {
      const [sickLeave, vacationLeave] = await Promise.all([
        this.getEmployeeLeaveBalance(accountId, 'sick'),
        this.getEmployeeLeaveBalance(accountId, 'vacation'),
      ]);

      // If neither leave type exists, return null
      if (!sickLeave && !vacationLeave) {
        return null;
      }

      // Combine the balances
      const totalUsed = (sickLeave?.used || 0) + (vacationLeave?.used || 0);
      const totalCredits = (sickLeave?.total || 0) + (vacationLeave?.total || 0);

      return {
        used: totalUsed,
        total: totalCredits,
      };
    } catch (error) {
      console.error('Error getting combined leave balance:', error);
      return null;
    }
  }

  /**
   * Get count of all tasks assigned to the employee
   */
  private async getEmployeeTasksCount(accountId: string): Promise<number> {
    try {
      const count = await this.prismaService.task.count({
        where: {
          OR: [
            { assignedToId: accountId },
            { TaskWatcher: { some: { accountId } } },
          ],
          isDeleted: false,
        },
      });

      return count;
    } catch (error) {
      console.error('Error getting employee tasks count:', error);
      return 0;
    }
  }

  /**
   * Get employee's cutoff date ranges based on their payroll group
   */
  async getEmployeeCutoffDateRanges(
    accountId: string,
  ): Promise<EmployeeCutoffDateRangesResponse> {
    try {
      // Get employee with payroll group
      const employeeData = await this.prismaService.employeeData.findFirst({
        where: { accountId },
        include: {
          payrollGroup: {
            include: {
              cutoff: true,
            },
          },
        },
      });

      if (!employeeData?.payrollGroup?.cutoff?.id) {
        return {
          cutoffDateRanges: [],
          currentCutoffId: null,
        };
      }

      const cutoffId = employeeData.payrollGroup.cutoff.id;
      const currentDate = new Date();

      // Get all cutoff date ranges for the employee's cutoff
      const cutoffDateRanges =
        await this.prismaService.cutoffDateRange.findMany({
          where: {
            cutoffId,
            status: {
              in: [
                CutoffDateRangeStatus.TIMEKEEPING,
                CutoffDateRangeStatus.PENDING,
                CutoffDateRangeStatus.PROCESSED,
                CutoffDateRangeStatus.APPROVED,
                CutoffDateRangeStatus.POSTED,
              ],
            },
          },
          orderBy: {
            startDate: 'desc',
          },
        });

      // Find the current cutoff
      const currentCutoff = cutoffDateRanges.find(
        (cutoff) =>
          cutoff.startDate <= currentDate && cutoff.endDate >= currentDate,
      );

      // Format the response
      const formattedCutoffDateRanges: EmployeeCutoffDateRange[] =
        cutoffDateRanges.map((cutoff) => ({
          id: cutoff.id,
          label: `${this.formatDate(cutoff.startDate)} - ${this.formatDate(cutoff.endDate)}`,
          startDate: cutoff.startDate,
          endDate: cutoff.endDate,
          status: cutoff.status,
          isCurrent: cutoff.id === currentCutoff?.id,
        }));

      return {
        cutoffDateRanges: formattedCutoffDateRanges,
        currentCutoffId: currentCutoff?.id || null,
      };
    } catch (error) {
      console.error('Error getting employee cutoff date ranges:', error);
      return {
        cutoffDateRanges: [],
        currentCutoffId: null,
      };
    }
  }

  /**
   * Get employee attendance conflicts for a specific date range
   */
  async getEmployeeAttendanceConflicts(
    accountId: string,
    startDate: string,
    endDate: string,
    page = 1,
    limit = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      // Convert date strings to proper Date objects with time
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);

      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);

      // Get attendance conflicts for the employee within the date range
      const whereClause = {
        accountId,
        isResolved: false,
        conflictDate: {
          gte: startDateTime,
          lte: endDateTime,
        },
      };

      // Get total count
      const total = await this.prismaService.attendanceConflict.count({
        where: whereClause,
      });

      // Get conflicts with pagination
      const conflicts = await this.prismaService.attendanceConflict.findMany({
        where: whereClause,
        include: {
          account: {
            include: {
              EmployeeData: {
                select: {
                  employeeCode: true,
                },
              },
            },
          },
        },
        orderBy: {
          conflictDate: 'desc',
        },
        skip,
        take: limit,
      });

      return {
        conflicts,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error getting employee attendance conflicts:', error);
      throw error;
    }
  }

  /**
   * Get employee attendance data for a specific date range
   */
  async getEmployeeAttendance(
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<EmployeeAttendanceResponse> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Get employee timekeeping data within the date range
      const timekeepingData =
        await this.prismaService.employeeTimekeeping.findMany({
          where: {
            employeeTimekeepingCutoff: {
              accountId,
            },
            date: {
              gte: start,
              lte: end,
            },
          },
          include: {
            EmployeeTimekeepingLogs: {
              orderBy: {
                createdAt: 'asc',
              },
            },
            employeeTimekeepingCutoff: {
              include: {
                account: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        });

      // Transform the data into attendance records
      const attendanceRecords: AttendanceRecord[] = timekeepingData.map(
        (record) => {
          const logs = record.EmployeeTimekeepingLogs || [];
          const workLogs = logs.filter((log) => log.type === 'WORK_TIME');
          const firstLog = workLogs[0];
          const lastLog = workLogs[workLogs.length - 1];

          // Determine status and conflicts
          const hasTimeIn = !!firstLog?.timeIn && firstLog.timeIn !== '00:00';
          const hasTimeOut = !!lastLog?.timeOut && lastLog.timeOut !== '00:00';
          const isPresent = record.presentDayCount > 0;
          const isAbsent = record.absentCount > 0;

          let status = 'NO_TIME_RECORDED';
          let hasConflict = false;
          let description = '';

          if (isPresent) {
            if (hasTimeIn && hasTimeOut) {
              status = 'PRESENT';
            } else if (hasTimeIn && !hasTimeOut) {
              status = 'NO_TIME_OUT';
              hasConflict = true;
              description = 'Missing time out';
            } else if (!hasTimeIn && hasTimeOut) {
              status = 'NO_TIME_IN';
              hasConflict = true;
              description = 'Missing time in';
            } else {
              status = 'PRESENT';
            }
          } else if (isAbsent) {
            status = 'ABSENT';
            hasConflict = true;
            description = record.remarks || 'Absent';
          }

          // Add late/undertime information
          if (record.lateMinutes > 0) {
            description += description ? ' - ' : '';
            description += `Late: ${Math.round(record.lateMinutes)} mins`;
            hasConflict = true;
          }
          if (record.undertimeMinutes > 0) {
            description += description ? ', ' : '';
            description += `Undertime: ${Math.round(record.undertimeMinutes)} mins`;
            hasConflict = true;
          }

          // Convert minutes to hours for display using formatHours
          const workTimeHours = record.workMinutes / 60;
          const overtimeHours = record.overtimeMinutes / 60;
          const lateHours = record.lateMinutes / 60;
          const undertimeHours = record.undertimeMinutes / 60;

          // Format time in/out properly
          const formattedTimeIn =
            firstLog?.timeIn && firstLog.timeIn !== '00:00'
              ? this.utilityService.formatTime(firstLog.timeIn).time
              : undefined;
          const formattedTimeOut =
            lastLog?.timeOut && lastLog.timeOut !== '00:00'
              ? this.utilityService.formatTime(lastLog.timeOut).time
              : undefined;

          return {
            id: record.id,
            date: record.date.toISOString().split('T')[0],
            dateFormatted: this.formatDate(record.date),
            timeIn: formattedTimeIn,
            timeOut: formattedTimeOut,
            status,
            hasConflict,
            description,
            workTime: workTimeHours,
            overtime: overtimeHours,
            late: lateHours,
            undertime: undertimeHours,
            isPresent,
            isAbsent,
            hasLeave: false,
            leaveType: undefined,
          };
        },
      );

      return {
        attendanceRecords,
        total: attendanceRecords.length,
        startDate,
        endDate,
      };
    } catch (error) {
      console.error('Error getting employee attendance:', error);
      return {
        attendanceRecords: [],
        total: 0,
        startDate,
        endDate,
      };
    }
  }

  /**
   * Get employee attendance calendar data
   * Returns comprehensive attendance details for each day in the date range
   */
  async getEmployeeAttendanceCalendar(
    accountId: string,
    startDate: string,
    endDate: string,
    cutoffStartDate?: string,
    cutoffEndDate?: string,
  ): Promise<EmployeeAttendanceCalendarResponse> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Get all dates in the range
      const dates: Date[] = [];
      const currentDate = new Date(start);
      while (currentDate <= end) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Get employee data with schedule
      const employeeData = await this.prismaService.employeeData.findFirst({
        where: { accountId },
        include: {
          schedule: {
            include: {
              mondayShift: true,
              tuesdayShift: true,
              wednesdayShift: true,
              thursdayShift: true,
              fridayShift: true,
              saturdayShift: true,
              sundayShift: true,
            },
          },
        },
      });

      // Get all timekeeping data for the date range
      const timekeepingData =
        await this.prismaService.employeeTimekeeping.findMany({
          where: {
            employeeTimekeepingCutoff: {
              accountId,
            },
            date: {
              gte: start,
              lte: end,
            },
          },
          include: {
            EmployeeTimekeepingLogs: {
              where: {
                type: 'WORK_TIME',
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
            EmployeeTimekeepingHoliday: true,
          },
        });

      // Get attendance conflicts for the date range
      const conflicts = await this.prismaService.attendanceConflict.findMany({
        where: {
          accountId,
          conflictDate: {
            gte: start,
            lte: end,
          },
          isResolved: false,
        },
      });

      // Get approved leaves for the date range (using PayrollFiling)
      const approvedLeaves = await this.prismaService.payrollFiling.findMany({
        where: {
          accountId,
          filingType: 'LEAVE',
          status: 'APPROVED',
          date: {
            gte: start,
            lte: end,
          },
        },
      });

      // Create a map for quick lookup
      const timekeepingMap = new Map<string, any>();
      timekeepingData.forEach((record) => {
        const dateKey = record.date.toISOString().split('T')[0];
        timekeepingMap.set(dateKey, record);
      });

      const conflictMap = new Map<string, any>();
      conflicts.forEach((conflict) => {
        const dateKey = conflict.conflictDate.toISOString().split('T')[0];
        conflictMap.set(dateKey, conflict);
      });

      // Parse cutoff dates if provided
      const cutoffStart = cutoffStartDate ? new Date(cutoffStartDate) : null;
      const cutoffEnd = cutoffEndDate ? new Date(cutoffEndDate) : null;

      // Process each date
      const calendarDays: AttendanceCalendarDay[] = dates.map((date) => {
        const dateString = date.toISOString().split('T')[0];
        const timekeeping = timekeepingMap.get(dateString);
        const conflict = conflictMap.get(dateString);

        // Check if date has an approved leave
        const leave = approvedLeaves.find((l) => {
          if (!l.date) return false;
          const leaveDate = new Date(l.date).toISOString().split('T')[0];
          return leaveDate === dateString;
        });

        // Check if date is within cutoff period
        const isWithinCutoff =
          cutoffStart && cutoffEnd
            ? date >= cutoffStart && date <= cutoffEnd
            : false;

        // Initialize calendar day
        const calendarDay: AttendanceCalendarDay = {
          date: dateString,
          details: [],
          status: 'NO_SCHEDULE',
          hasConflict: false,
          isWithinCutoff,
        };

        // Check if it's a scheduled work day
        const isWorkDay = this.isScheduledWorkDay(date, employeeData?.schedule);

        if (timekeeping) {
          const logs = timekeeping.EmployeeTimekeepingLogs || [];
          const firstLog = logs[0];
          const lastLog = logs[logs.length - 1];

          // Calculate work hours using formatHours
          if (timekeeping.workMinutes > 0) {
            const hoursData = this.utilityService.formatHours(
              timekeeping.workMinutes / 60,
            );
            calendarDay.workHours = hoursData.hours + hoursData.minutes / 60;
          }

          // Set time in/out with proper formatting
          if (firstLog?.timeIn && firstLog.timeIn !== '00:00') {
            const timeData = this.utilityService.formatTime(firstLog.timeIn);
            calendarDay.timeIn = timeData.time; // This will be in "hh:mm A" format
          }
          if (lastLog?.timeOut && lastLog.timeOut !== '00:00') {
            const timeData = this.utilityService.formatTime(lastLog.timeOut);
            calendarDay.timeOut = timeData.time; // This will be in "hh:mm A" format
          }

          // Check holidays
          if (timekeeping.EmployeeTimekeepingHoliday?.length > 0) {
            calendarDay.status = 'HOLIDAY';
            calendarDay.holidayName =
              timekeeping.EmployeeTimekeepingHoliday[0].name;
            calendarDay.details.push(`Holiday: ${calendarDay.holidayName}`);
          }
          // Check if present
          else if (timekeeping.presentDayCount > 0) {
            calendarDay.status = 'PRESENT';

            // Add positive status first
            if (
              !timekeeping.lateMinutes &&
              !timekeeping.undertimeMinutes &&
              calendarDay.timeIn &&
              calendarDay.timeOut
            ) {
              calendarDay.details.push('Present');
              calendarDay.details.push('On Time');
            } else {
              calendarDay.details.push('Present');
            }

            // Add issues
            if (timekeeping.lateMinutes > 0) {
              calendarDay.hasConflict = true;
              calendarDay.lateMinutes = Math.round(timekeeping.lateMinutes);
              calendarDay.details.push(
                `${calendarDay.lateMinutes} Minutes Late`,
              );
            }

            if (timekeeping.undertimeMinutes > 0) {
              calendarDay.hasConflict = true;
              calendarDay.undertimeMinutes = Math.round(
                timekeeping.undertimeMinutes,
              );
              calendarDay.details.push(
                `${calendarDay.undertimeMinutes} Minutes Undertime`,
              );
            }

            if (timekeeping.overtimeMinutes > 0) {
              calendarDay.overtimeMinutes = Math.round(
                timekeeping.overtimeMinutes,
              );
              calendarDay.details.push(
                `${calendarDay.overtimeMinutes} Minutes Overtime`,
              );
            }

            // Check for missing logs
            if (!calendarDay.timeIn) {
              calendarDay.hasConflict = true;
              calendarDay.details.push('No Time In');
            }
            if (!calendarDay.timeOut) {
              calendarDay.hasConflict = true;
              calendarDay.details.push('No Time Out');
            }
          }
          // Absent
          else if (timekeeping.absentCount > 0) {
            calendarDay.status = 'ABSENT';
            calendarDay.hasConflict = true;
            calendarDay.details.push('Absent');
            if (timekeeping.remarks) {
              calendarDay.remarks = timekeeping.remarks;
            }
          }
        }
        // No timekeeping record
        else if (leave) {
          calendarDay.status = 'LEAVE';
          const leaveData = leave.leaveData as any;
          calendarDay.leaveType = leaveData?.leaveType || 'Leave';
          calendarDay.details.push(
            `On Leave${calendarDay.leaveType !== 'Leave' ? ': ' + calendarDay.leaveType : ''}`,
          );
        } else if (conflict) {
          calendarDay.hasConflict = true;

          // Only mark as absent if it's actually a scheduled work day
          if (isWorkDay) {
            if (conflict.conflictType === 'MISSING_LOG') {
              calendarDay.status = 'ABSENT';
              calendarDay.details.push('Absent');
            } else if (conflict.conflictType === 'MISSING_TIME_OUT') {
              calendarDay.status = 'PRESENT';
              calendarDay.details.push('No Time Out');
            } else if (conflict.conflictType === 'NO_ATTENDANCE') {
              calendarDay.status = 'ABSENT';
              calendarDay.details.push('No Time Recorded');
            }
          } else {
            // It's a rest day - don't mark as absent even if there's a conflict
            calendarDay.status = 'REST_DAY';
            calendarDay.details.push('Rest Day');
            // Keep hasConflict flag to show there was a system issue on this rest day
          }

          if (conflict.description) {
            calendarDay.remarks = conflict.description;
          }
        } else if (isWorkDay) {
          // It's a work day but no record - mark as absent
          calendarDay.status = 'ABSENT';
          calendarDay.hasConflict = true;
          calendarDay.details.push('Absent');
        } else {
          // Not a work day
          calendarDay.status = 'REST_DAY';
          calendarDay.details.push('Rest Day');
        }

        return calendarDay;
      });

      return {
        calendarDays,
        startDate,
        endDate,
      };
    } catch (error) {
      console.error('Error getting employee attendance calendar:', error);
      return {
        calendarDays: [],
        startDate,
        endDate,
      };
    }
  }

  /**
   * Helper method to check if a date is a scheduled work day
   */
  private isScheduledWorkDay(date: Date, schedule: any): boolean {
    if (!schedule) {
      // If no schedule, assume Monday-Friday are work days
      const dayOfWeek = date.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    }

    const dayOfWeek = date.getDay();
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const dayName = dayNames[dayOfWeek];

    // Check if this day has a shift
    const shiftKey = `${dayName}Shift` as keyof typeof schedule;
    const shift = schedule[shiftKey];

    // If shift exists and is not a rest day, it's a work day
    return !!shift && shift.shiftCode !== 'REST_DAY';
  }
}
