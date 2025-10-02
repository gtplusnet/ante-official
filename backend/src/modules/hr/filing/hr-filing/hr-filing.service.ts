import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  PayrollFilingType,
  PayrollFilingStatus,
  ShiftType,
} from '@prisma/client';
import { EmailApprovalService } from '@modules/communication/email-approval/services/email-approval.service';

// Define response types locally
interface FilingResponse {
  id: number;
  filingType: any;
  status: any;
  accountId: string;
  account?: any;
  timeIn?: Date;
  timeOut?: Date;
  date?: Date;
  hours?: number;
  nightDifferentialHours?: number;
  isApproved: boolean;
  approvedById?: string;
  approvedBy?: any;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  remarks?: string;
  rejectReason?: string;
  fileId?: number;
  file?: any;
  timeAgo?: string;
  shiftData?: any;
  leaveData?: any;
  shiftId?: number;
  [key: string]: any;
}

interface FilingsListResponse {
  data: FilingResponse[];
  total: number;
  page: number;
  limit: number;
}
import PayrollFilingTypeReference from '../../../../reference/payroll-filing-type.reference';
import PayrollFilingStatusReference from '../../../../reference/payroll-filing-status.reference';
import { UtilityService } from '@common/utility.service';
import {
  CreatePayrollFilingDTO,
  UpdatePayrollFilingDTO,
  FilingActionDTO,
  QueryFilingDTO,
} from './dto/payroll-filing.dto';
import { ApprovalService } from '@modules/approval/approval.service';
import { FilingApprovalStrategy } from './strategies/filing-approval.strategy';
import { ShiftConfigurationService } from '@modules/hr/configuration/shift-configuration/shift-configuration.service';
import { FilingNotificationService } from '../services/filing-notification.service';
import { OvertimeFilingIntegrationService } from '../services/overtime-filing-integration.service';
import { EmployeeLeavePlanService } from '@modules/hr/configuration/leave-configuration/employee-leave-plan.service';
import * as moment from 'moment';

@Injectable()
export class HrFilingService {
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly approvalService: ApprovalService;
  @Inject() private readonly filingApprovalStrategy: FilingApprovalStrategy;
  @Inject()
  private readonly shiftConfigurationService: ShiftConfigurationService;
  @Inject()
  private readonly filingNotificationService: FilingNotificationService;
  @Inject()
  private readonly overtimeFilingIntegrationService: OvertimeFilingIntegrationService;
  @Inject() private readonly employeeLeavePlanService: EmployeeLeavePlanService;
  @Inject() private readonly emailApprovalService: EmailApprovalService;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Register the filing approval strategy
    this.approvalService.registerStrategy(
      'HR_FILING',
      this.filingApprovalStrategy,
    );
  }

  async createFiling(request: CreatePayrollFilingDTO): Promise<FilingResponse> {
    if (request.fileId) {
      const file = await this.prisma.files.findUnique({
        where: { id: request.fileId },
      });
      if (!file) throw new NotFoundException('File not found');
    }
    // Prepare create data
    const createData: any = {
      filingType: request.filingType,
      accountId: this.utilityService.accountInformation.id,
      timeIn: request.timeIn
        ? new Date(request.timeIn)
        : request.dateFrom
          ? new Date(request.dateFrom)
          : undefined,
      timeOut: request.timeOut
        ? new Date(request.timeOut)
        : request.dateTo
          ? new Date(request.dateTo)
          : undefined,
      date: request.date ? new Date(request.date) : undefined,
      hours: request.hours,
      nightDifferentialHours: request.nightDifferentialHours,
      fileId: request.fileId,
      remarks: request.reason, // Map reason to remarks field
    };

    // Create variables to hold filing data
    let data: any;

    // Handle SCHEDULE_ADJUSTMENT specific data
    if (
      request.filingType === PayrollFilingType.SCHEDULE_ADJUSTMENT &&
      request.shiftData
    ) {
      // Create the filing first
      const filing = await this.prisma.payrollFiling.create({
        data: createData,
        include: {
          account: true,
        },
      });

      // Convert shiftData to the format expected by shift configuration service
      const shiftParams = {
        shiftCode: request.shiftData.shiftCode,
        shiftType: request.shiftData.shiftType
          .replace(' ', '_')
          .toUpperCase() as ShiftType,
        breakHours: request.shiftData.totalBreakHours || 0,
        targetHours: request.shiftData.targetHours || 0,
        shiftTime: request.shiftData.workingHours || [],
      };

      // Create adjustment shift
      await this.shiftConfigurationService.createAdjustmentShift(
        shiftParams,
        filing.id,
      );

      // Update filing to include shift relation
      data = await this.prisma.payrollFiling.update({
        where: { id: filing.id },
        data: { shiftData: request.shiftData as any }, // Keep shiftData for backwards compatibility
        include: {
          account: true,
          shift: true,
        },
      });
    } else {
      // Handle LEAVE specific data
      if (
        request.filingType === PayrollFilingType.LEAVE &&
        request['leaveData']
      ) {
        createData.leaveData = request['leaveData'];

        // Validate for duplicate leave filings before creating
        const dateFrom = request.dateFrom
          ? new Date(request.dateFrom)
          : new Date(request.date);
        const dateTo = request.dateTo
          ? new Date(request.dateTo)
          : new Date(request.date);

        const leaveData = request['leaveData'] as any;
        await this.validateDuplicateLeave(
          this.utilityService.accountInformation.id,
          dateFrom,
          dateTo,
          undefined, // No excludeFilingId for new filings
          leaveData?.employeeLeavePlanId,
        );
      }

      data = await this.prisma.payrollFiling.create({
        data: createData,
        include: {
          account: true,
        },
      });

      // Deduct leave credits immediately for WITH_PAY leaves
      if (
        request.filingType === PayrollFilingType.LEAVE &&
        request['leaveData']
      ) {
        const leaveData = request['leaveData'] as any;
        if (
          leaveData.compensationType === 'WITH_PAY' &&
          leaveData.employeeLeavePlanId
        ) {
          try {
            // Deduct leave credits immediately when filing is created
            await this.employeeLeavePlanService.adjustCredits(
              leaveData.employeeLeavePlanId,
              {
                amount: leaveData.days || 1,
                reason: `Leave filed - ${leaveData.leaveType} from ${moment(data.timeIn || data.date).format('MMM DD, YYYY')} to ${moment(data.timeOut || data.date).format('MMM DD, YYYY')}`,
                transactionType: 'DEBIT',
                referenceId: `FILING-${data.id}`,
              },
              this.utilityService.accountInformation.id,
            );
          } catch (error) {
            // If credit deduction fails, rollback the filing creation
            await this.prisma.payrollFiling.delete({
              where: { id: data.id },
            });
            throw new BadRequestException(
              `Failed to deduct leave credits: ${error.message}`,
            );
          }
        }
      }
    }

    // Get the user's parent (reporting manager) for approval
    const userAccount = await this.prisma.account.findUnique({
      where: { id: this.utilityService.accountInformation.id },
      select: { parentAccountId: true },
    });

    if (userAccount?.parentAccountId) {
      // Build detailed description based on filing type
      let detailedDescription = `Review and approve ${this.getFilingTypeLabel(data.filingType)} request\n\n`;

      // Add common details
      detailedDescription += `**Requestor:** ${data.account.firstName} ${data.account.lastName}\n`;
      detailedDescription += `**Date Filed:** ${new Date().toLocaleDateString()}\n`;

      // Add type-specific details
      switch (data.filingType) {
        case PayrollFilingType.OVERTIME:
          detailedDescription += `**Date:** ${data.date ? new Date(data.date).toLocaleDateString() : 'N/A'}\n`;
          detailedDescription += `**Regular Overtime Hours:** ${data.hours || 0}\n`;
          detailedDescription += `**Night Differential Hours:** ${data.nightDifferentialHours || 0}\n`;
          if (data.timeIn)
            detailedDescription += `**Time In:** ${new Date(data.timeIn).toLocaleTimeString()}\n`;
          if (data.timeOut)
            detailedDescription += `**Time Out:** ${new Date(data.timeOut).toLocaleTimeString()}\n`;
          break;

        case PayrollFilingType.LEAVE:
          if (data.leaveData && typeof data.leaveData === 'object') {
            const leaveData = data.leaveData as any;
            const dateFrom = data.timeIn
              ? new Date(data.timeIn)
              : data.date
                ? new Date(data.date)
                : null;
            const dateTo = data.timeOut ? new Date(data.timeOut) : dateFrom;

            detailedDescription += `**Leave Type:** ${leaveData.leaveType || 'N/A'}\n`;
            detailedDescription += `**Compensation Type:** ${leaveData.compensationType || 'N/A'}\n`;
            detailedDescription += `**Date From:** ${dateFrom ? dateFrom.toLocaleDateString() : 'N/A'}\n`;
            detailedDescription += `**Date To:** ${dateTo ? dateTo.toLocaleDateString() : 'N/A'}\n`;
            detailedDescription += `**Number of Days:** ${leaveData.days || 'N/A'}\n`;

            // Add credit information for WITH_PAY leaves
            if (
              leaveData.compensationType === 'WITH_PAY' &&
              leaveData.employeeLeavePlanId
            ) {
              // Fetch current credits
              const employeePlan =
                await this.prisma.employeeLeavePlan.findUnique({
                  where: { id: leaveData.employeeLeavePlanId },
                  include: {
                    leavePlan: {
                      include: {
                        leaveTypeConfiguration: true,
                      },
                    },
                  },
                });

              if (employeePlan) {
                detailedDescription += `**Current Leave Balance:** ${employeePlan.currentCredits} days\n`;
                detailedDescription += `**Leave Plan:** ${employeePlan.leavePlan.planName}\n`;
                detailedDescription += `**Balance After Approval:** ${parseFloat(employeePlan.currentCredits.toString()) - leaveData.days} days\n`;
              }
            }
          } else {
            // Fallback for legacy format
            detailedDescription += `**Leave Date:** ${data.date ? new Date(data.date).toLocaleDateString() : 'N/A'}\n`;
            detailedDescription += `**Hours:** ${data.hours || 'N/A'}\n`;
          }
          break;

        case PayrollFilingType.SCHEDULE_ADJUSTMENT:
          detailedDescription += `**Adjustment Date:** ${data.date ? new Date(data.date).toLocaleDateString() : 'N/A'}\n`;
          if (data.shiftData && typeof data.shiftData === 'object') {
            const shiftData = data.shiftData as any;
            detailedDescription += `**Shift Type:** ${shiftData.shiftType || 'N/A'}\n`;
            detailedDescription += `**Target Hours:** ${shiftData.targetHours || 'N/A'}\n`;
            detailedDescription += `**Working Hours:** ${shiftData.workingHours || 'N/A'}\n`;
            detailedDescription += `**Break Hours:** ${shiftData.totalBreakHours || 'N/A'}\n`;
          }
          break;

        case PayrollFilingType.OFFICIAL_BUSINESS_FORM:
        case PayrollFilingType.CERTIFICATE_OF_ATTENDANCE:
          detailedDescription += `**Date:** ${data.date ? new Date(data.date).toLocaleDateString() : 'N/A'}\n`;
          if (data.timeIn)
            detailedDescription += `**Time In:** ${new Date(data.timeIn).toLocaleTimeString()}\n`;
          if (data.timeOut)
            detailedDescription += `**Time Out:** ${new Date(data.timeOut).toLocaleTimeString()}\n`;
          break;
      }

      // Add remarks if present
      if (data.remarks) {
        detailedDescription += `\n**Reason/Remarks:** ${data.remarks}`;
      }

      // Add file attachment note if present
      if (data.fileId) {
        detailedDescription += `\n**Attachment:** File attached`;
      }

      // Create approval task for the user's parent/manager
      const taskId = await this.approvalService.createApprovalTask({
        sourceModule: 'HR_FILING',
        sourceId: data.id.toString(),
        approverId: userAccount.parentAccountId,
        title: `${this.getFilingTypeLabel(data.filingType)} Request from ${data.account.firstName} ${data.account.lastName}`,
        description: detailedDescription,
        metadata: {
          actions: ['approve', 'reject', 'request_info'],
          sourceData: {
            // Store only the filing ID - fetch fresh data when needed
            filingId: data.id,
            // Keep minimal data that won't change
            filingType: data.filingType,
            filingTypeLabel: this.getFilingTypeLabel(data.filingType),
            requestorName: `${data.account.firstName} ${data.account.lastName}`,
            requestorId: data.accountId,
          },
        },
      });

      // Update filing with approval task ID
      await this.prisma.payrollFiling.update({
        where: { id: data.id },
        data: { approvalTaskId: taskId },
      });

      // Fetch complete filing data with all necessary includes for notification
      const filingWithIncludes = await this.prisma.payrollFiling.findUnique({
        where: { id: data.id },
        include: {
          account: true,
          file: true,
          shift: true,
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Send approval request notification using the filing notification service
      await this.filingNotificationService.sendApprovalRequest({
        filing: { ...filingWithIncludes, approvalTaskId: taskId },
        approverId: userAccount.parentAccountId,
      });

      // Get approver information for email
      const approver = await this.prisma.account.findUnique({
        where: { id: userAccount.parentAccountId },
        select: { firstName: true, lastName: true, email: true },
      });

      // Send email approval with encrypted action buttons
      if (approver?.email) {
        try {
          // Get employee details for richer email content
          const employeeData = await this.prisma.employeeData.findUnique({
            where: { accountId: data.accountId },
            include: {
              branch: true,
              payrollGroup: true,
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

          // Determine the template based on filing type
          const templateMapping = {
            OFFICIAL_BUSINESS_FORM: 'hr-filing-official-business',
            CERTIFICATE_OF_ATTENDANCE: 'hr-filing-certificate-attendance',
            OVERTIME: 'hr-filing-overtime',
            SCHEDULE_ADJUSTMENT: 'hr-filing-schedule-adjustment',
            LEAVE: 'hr-filing-leave',
          };

          const templateName =
            templateMapping[data.filingType] || 'hr-filing-approval';

          // Prepare comprehensive filing data for email template
          const filingData: any = {
            // Basic Information
            filingId: data.id,
            filingType: data.filingType,
            filingTypeLabel: this.getFilingTypeLabel(data.filingType),
            requestorName: `${data.account.firstName} ${data.account.lastName}`,
            approverName: `${approver.firstName} ${approver.lastName}`,
            submittedDate: data.createdAt.toLocaleString(),

            // Employee Information
            employeeId:
              employeeData?.employeeCode || data.accountId.substring(0, 8),
            department: employeeData?.branch?.name || 'N/A',
            position: 'N/A', // Position is not directly available in the current schema

            // Date and Time Information
            date: data.date
              ? data.date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '',
            dayOfWeek: data.date
              ? data.date.toLocaleDateString('en-US', { weekday: 'long' })
              : '',
            timeIn: data.timeIn
              ? new Date(data.timeIn).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '',
            timeOut: data.timeOut
              ? new Date(data.timeOut).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '',
            hours: data.hours || 0,
            nightDifferentialHours: data.nightDifferentialHours || 0,

            // Remarks/Reason
            remarks: data.remarks || '',

            // Attachment
            hasAttachment: !!data.fileId,

            // Regular Schedule (for comparison)
            regularSchedule: 'Standard Schedule', // We'll need to determine based on day of week
          };

          // Add type-specific data
          switch (data.filingType) {
            case PayrollFilingType.LEAVE:
              if (data.leaveData && typeof data.leaveData === 'object') {
                const leaveData = data.leaveData as any;
                filingData.leaveData = leaveData;

                // Calculate leave period
                const dateFrom = data.timeIn
                  ? new Date(data.timeIn)
                  : data.date
                    ? new Date(data.date)
                    : null;
                const dateTo = data.timeOut ? new Date(data.timeOut) : dateFrom;

                filingData.dateFrom = dateFrom
                  ? dateFrom.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '';
                filingData.dateTo = dateTo
                  ? dateTo.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '';
                filingData.dayFrom = dateFrom
                  ? dateFrom.toLocaleDateString('en-US', { weekday: 'long' })
                  : '';
                filingData.dayTo = dateTo
                  ? dateTo.toLocaleDateString('en-US', { weekday: 'long' })
                  : '';
                filingData.numberOfDays = leaveData.days || 1;

                // Add leave balance info for WITH_PAY leaves
                if (
                  leaveData.compensationType === 'WITH_PAY' &&
                  leaveData.employeeLeavePlanId
                ) {
                  const employeePlan =
                    await this.prisma.employeeLeavePlan.findUnique({
                      where: { id: leaveData.employeeLeavePlanId },
                      include: {
                        leavePlan: {
                          include: {
                            leaveTypeConfiguration: true,
                          },
                        },
                      },
                    });

                  if (employeePlan) {
                    filingData.leaveBalance = {
                      leavePlanName: employeePlan.leavePlan.planName,
                      currentBalance: parseFloat(
                        employeePlan.currentCredits.toString(),
                      ),
                      balanceAfter:
                        parseFloat(employeePlan.currentCredits.toString()) -
                        leaveData.days,
                    };
                  }
                }
              }
              break;

            case PayrollFilingType.SCHEDULE_ADJUSTMENT:
              if (data.shiftData && typeof data.shiftData === 'object') {
                filingData.shiftData = data.shiftData;

                // Add current vs new schedule comparison
                // Get the shift for the day of the filing
                if (employeeData?.schedule && data.date) {
                  const dayOfWeek = data.date.getDay();
                  let currentShift: any = null;

                  switch (dayOfWeek) {
                    case 0:
                      currentShift = employeeData.schedule.sundayShift;
                      break;
                    case 1:
                      currentShift = employeeData.schedule.mondayShift;
                      break;
                    case 2:
                      currentShift = employeeData.schedule.tuesdayShift;
                      break;
                    case 3:
                      currentShift = employeeData.schedule.wednesdayShift;
                      break;
                    case 4:
                      currentShift = employeeData.schedule.thursdayShift;
                      break;
                    case 5:
                      currentShift = employeeData.schedule.fridayShift;
                      break;
                    case 6:
                      currentShift = employeeData.schedule.saturdayShift;
                      break;
                  }

                  if (currentShift) {
                    // Get shift times for the current shift
                    const shiftTimes = await this.prisma.shiftTime.findMany({
                      where: { shiftId: currentShift.id },
                      orderBy: { startTime: 'asc' },
                    });

                    const workTimes = shiftTimes.filter(
                      (st) => !st.isBreakTime,
                    );
                    // breakTimes filtering removed as it wasn't used

                    filingData.currentShiftType = currentShift.shiftCode;
                    filingData.currentStartTime =
                      workTimes[0]?.startTime || '8:00 AM';
                    filingData.currentEndTime =
                      workTimes[workTimes.length - 1]?.endTime || '5:00 PM';
                    filingData.currentWorkingHours = `${filingData.currentStartTime} - ${filingData.currentEndTime}`;
                    filingData.currentTotalHours =
                      currentShift.targetHours || 8;
                    filingData.currentBreakTime = `${currentShift.breakHours || 1} hour(s)`;
                  }
                }

                // Parse new schedule from shiftData
                const shiftData = data.shiftData as any;
                if (
                  shiftData.workingHours &&
                  shiftData.workingHours.length > 0
                ) {
                  const firstWork = shiftData.workingHours.find(
                    (wh: any) => !wh.isBreakTime,
                  );
                  const lastWork = [...shiftData.workingHours]
                    .reverse()
                    .find((wh: any) => !wh.isBreakTime);

                  filingData.newStartTime = firstWork?.startTime || '';
                  filingData.newEndTime = lastWork?.endTime || '';
                  filingData.newTotalHours = shiftData.targetHours || 0;
                  filingData.newWorkingHours = `${firstWork?.startTime || ''} - ${lastWork?.endTime || ''}`;
                  filingData.newBreakTime = `${shiftData.totalBreakHours || 0} hour(s)`;
                }
              }
              break;

            case PayrollFilingType.OVERTIME:
              // Add overtime-specific calculations
              filingData.regularOTHours = data.hours || 0;

              // Get the regular end time for the day
              if (employeeData?.schedule && data.date) {
                const dayOfWeek = data.date.getDay();
                let dayShift: any = null;

                switch (dayOfWeek) {
                  case 0:
                    dayShift = employeeData.schedule.sundayShift;
                    break;
                  case 1:
                    dayShift = employeeData.schedule.mondayShift;
                    break;
                  case 2:
                    dayShift = employeeData.schedule.tuesdayShift;
                    break;
                  case 3:
                    dayShift = employeeData.schedule.wednesdayShift;
                    break;
                  case 4:
                    dayShift = employeeData.schedule.thursdayShift;
                    break;
                  case 5:
                    dayShift = employeeData.schedule.fridayShift;
                    break;
                  case 6:
                    dayShift = employeeData.schedule.saturdayShift;
                    break;
                }

                if (dayShift) {
                  const shiftTimes = await this.prisma.shiftTime.findMany({
                    where: { shiftId: dayShift.id, isBreakTime: false },
                    orderBy: { endTime: 'desc' },
                  });

                  filingData.regularEndTime =
                    shiftTimes[0]?.endTime || '5:00 PM';
                } else {
                  filingData.regularEndTime = '5:00 PM';
                }
              } else {
                filingData.regularEndTime = '5:00 PM';
              }

              // Check if it's a rest day or holiday
              const filingDate = data.date || new Date();
              const dayOfWeek = filingDate.getDay();
              filingData.isRestDay = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

              // Calculate OT multiplier (simplified)
              filingData.otMultiplier = filingData.isRestDay ? '1.3' : '1.25';

              // Add monthly OT summary (would need to query from database)
              // For now, adding placeholder
              filingData.monthlyOTSummary = true;
              filingData.monthlyOTHours = 0; // Would calculate from database
              filingData.otInstances = 1; // Would count from database
              filingData.avgOTHours = data.hours || 0;
              break;
          }

          await this.emailApprovalService.sendApprovalEmail({
            taskId: taskId,
            approverId: userAccount.parentAccountId,
            module: 'HR_FILING',
            sourceId: data.id.toString(),
            templateName: templateName,
            approvalData: filingData,
            recipientEmail: approver.email,
          });
          console.log(
            `Email approval sent to ${approver.email} for HR filing approval task ${taskId}`,
          );
        } catch (error) {
          console.error('Failed to send email approval for HR filing:', error);
          // Continue with regular notification even if email fails
        }
      }
    } else {
      // No parent/manager - auto-approve
      await this.prisma.payrollFiling.update({
        where: { id: data.id },
        data: {
          status: PayrollFilingStatus.APPROVED,
          isApproved: true,
          approvedAt: new Date(),
          approvedById: this.utilityService.accountInformation.id,
          remarks: 'Auto-approved (no reporting manager)',
        },
      });
    }

    // Sync overtime filing to timekeeping
    await this.overtimeFilingIntegrationService.updateTimekeepingFromFiling(
      data,
    );

    return this.formatFilingResponse(data);
  }

  private getFilingTypeLabel(type: PayrollFilingType): string {
    const labels: Record<string, string> = {
      OFFICIAL_BUSINESS_FORM: 'Official Business',
      CERTIFICATE_OF_ATTENDANCE: 'Certificate of Attendance',
      OVERTIME: 'Overtime',
      SCHEDULE_ADJUSTMENT: 'Schedule Adjustment',
      LEAVE: 'Leave Request',
    };
    return labels[type] || type;
  }

  async updateFiling(request: UpdatePayrollFilingDTO): Promise<FilingResponse> {
    const {
      id,
      isApproved,
      approvedAt,
      status,
      remarks,
      filingType,
      timeIn,
      timeOut,
      date,
      hours,
      nightDifferentialHours,
      fileId,
      reason,
    } = request;

    // Check if filing exists and is editable
    const existingFiling = await this.prisma.payrollFiling.findUnique({
      where: { id },
    });

    if (!existingFiling) {
      throw new NotFoundException('Filing not found');
    }

    if (existingFiling.status !== PayrollFilingStatus.PENDING) {
      throw new BadRequestException(
        `Cannot update filing with status: ${existingFiling.status}. Only PENDING filings can be updated.`,
      );
    }

    // Verify ownership
    if (
      existingFiling.accountId !== this.utilityService.accountInformation.id
    ) {
      throw new BadRequestException('You can only update your own filings');
    }

    if (fileId) {
      const file = await this.prisma.files.findUnique({
        where: { id: fileId },
      });
      if (!file) throw new NotFoundException('File not found');
    }
    const updateData: any = {
      isApproved,
      approvedAt: approvedAt ? new Date(approvedAt) : undefined,
      status,
      remarks: reason !== undefined ? reason : remarks, // Map reason to remarks, prioritize reason if provided
      filingType,
      timeIn: timeIn ? new Date(timeIn) : undefined,
      timeOut: timeOut ? new Date(timeOut) : undefined,
      date: date ? new Date(date) : undefined,
      hours,
      nightDifferentialHours,
      fileId,
    };

    // Handle SCHEDULE_ADJUSTMENT specific data
    if (
      request.filingType === PayrollFilingType.SCHEDULE_ADJUSTMENT &&
      request.shiftData
    ) {
      updateData.shiftData = request.shiftData as any;

      // If filing has an associated shift, update it
      const filingWithShift = await this.prisma.payrollFiling.findUnique({
        where: { id },
        include: { shift: true },
      });

      if (filingWithShift?.shift) {
        // Update existing shift
        const shiftParams = {
          id: filingWithShift.shift.id,
          shiftCode: request.shiftData.shiftCode,
          shiftType: request.shiftData.shiftType
            .replace(' ', '_')
            .toUpperCase() as ShiftType,
          breakHours: request.shiftData.totalBreakHours || 0,
          targetHours: request.shiftData.targetHours || 0,
          shiftTime: request.shiftData.workingHours || [],
        };
        await this.shiftConfigurationService.create(shiftParams);
      }
    }

    // Handle LEAVE specific data
    if (
      request.filingType === PayrollFilingType.LEAVE &&
      request['leaveData']
    ) {
      updateData.leaveData = request['leaveData'];

      // Validate for duplicate leave filings before updating if dates have changed
      if (
        request.dateFrom !== undefined ||
        request.dateTo !== undefined ||
        request.date !== undefined
      ) {
        const dateFrom = request.dateFrom
          ? new Date(request.dateFrom)
          : request.date
            ? new Date(request.date)
            : existingFiling.timeIn || existingFiling.date;
        const dateTo = request.dateTo
          ? new Date(request.dateTo)
          : request.date
            ? new Date(request.date)
            : existingFiling.timeOut || existingFiling.date;

        if (dateFrom && dateTo) {
          const leaveData = request['leaveData'] as any;
          await this.validateDuplicateLeave(
            this.utilityService.accountInformation.id,
            new Date(dateFrom),
            new Date(dateTo),
            id, // Exclude current filing from check
            leaveData?.employeeLeavePlanId ||
              (existingFiling.leaveData as any)?.employeeLeavePlanId,
          );
        }
      }
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    // Store old date for syncing if date changed
    const oldDate = existingFiling.date;

    const data = await this.prisma.payrollFiling.update({
      where: { id },
      data: updateData,
    });

    // Sync overtime filing to timekeeping
    await this.overtimeFilingIntegrationService.updateTimekeepingFromFiling(
      data,
      oldDate || undefined,
    );

    return this.formatFilingResponse(data);
  }

  async getFilingById(id: number): Promise<FilingResponse> {
    const data = await this.prisma.payrollFiling.findUnique({
      where: { id },
      include: {
        account: true,
        approvedBy: true,
        file: true,
        shift: true,
      },
    });
    if (!data) throw new NotFoundException('PayrollFiling not found');
    return this.formatFilingResponse(data);
  }

  async cancelFiling({ id }: FilingActionDTO): Promise<FilingResponse> {
    // Check if filing exists and is cancellable
    const existingFiling = await this.prisma.payrollFiling.findUnique({
      where: { id },
    });

    if (!existingFiling) {
      throw new NotFoundException('Filing not found');
    }

    if (existingFiling.status !== PayrollFilingStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel filing with status: ${existingFiling.status}. Only PENDING filings can be cancelled.`,
      );
    }

    // Verify ownership
    if (
      existingFiling.accountId !== this.utilityService.accountInformation.id
    ) {
      throw new BadRequestException('You can only cancel your own filings');
    }

    const data = await this.prisma.payrollFiling.update({
      where: { id },
      data: { status: PayrollFilingStatus.CANCELLED },
    });

    // Handle leave credit returns for cancelled WITH_PAY leaves (credits were deducted on submission)
    if (
      existingFiling.filingType === PayrollFilingType.LEAVE &&
      existingFiling.leaveData
    ) {
      const leaveData = existingFiling.leaveData as any;
      if (
        leaveData.compensationType === 'WITH_PAY' &&
        leaveData.employeeLeavePlanId
      ) {
        try {
          // Return leave credits using the service
          await this.employeeLeavePlanService.adjustCredits(
            leaveData.employeeLeavePlanId,
            {
              amount: leaveData.days || 1,
              reason: `Leave cancelled - returning credits for ${leaveData.leaveType} from ${moment(existingFiling.timeIn || existingFiling.date).format('MMM DD, YYYY')} to ${moment(existingFiling.timeOut || existingFiling.date).format('MMM DD, YYYY')}`,
              transactionType: 'CREDIT',
              referenceId: `FILING-${existingFiling.id}-CANCELLED`,
            },
            existingFiling.accountId, // Use the requestor's ID for the cancellation
          );
        } catch (error) {
          // Log error but don't fail the cancellation
          console.error(
            `Failed to return leave credits for cancelled filing ${existingFiling.id}:`,
            error,
          );
        }
      }
    }

    // Sync overtime filing to timekeeping (removes from ForApproval)
    await this.overtimeFilingIntegrationService.updateTimekeepingFromFiling(
      data,
    );

    // Close the associated approval task if it exists
    if (existingFiling.approvalTaskId) {
      try {
        // Find the DONE lane
        const doneLane = await this.prisma.boardLane.findFirst({
          where: { key: 'DONE' },
        });

        if (doneLane) {
          // Update the task to mark it as done
          await this.prisma.task.update({
            where: { id: existingFiling.approvalTaskId },
            data: {
              boardLaneId: doneLane.id,
              isOpen: false,
              description: `${data.filingType} filing request was cancelled by the requestor`,
            },
          });
        }

        // Send cancellation notification to the approver
        const userAccount = await this.prisma.account.findUnique({
          where: { id: existingFiling.accountId },
          select: { parentAccountId: true },
        });

        if (userAccount?.parentAccountId) {
          const filingWithIncludes = await this.prisma.payrollFiling.findUnique(
            {
              where: { id: data.id },
              include: {
                account: true,
                file: true,
                shift: true,
                approvedBy: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          );

          await this.filingNotificationService.sendApprovalCancelled({
            filing: filingWithIncludes,
            approverId: userAccount.parentAccountId,
          });
        }
      } catch (error) {
        // Log error but don't fail the cancellation
        console.error(
          'Failed to update approval task or send notification:',
          error,
        );
      }
    }

    return this.formatFilingResponse(data);
  }

  async approveFiling({
    id,
    remarks,
  }: FilingActionDTO): Promise<FilingResponse> {
    // Get the filing with approval task
    const filing = await this.prisma.payrollFiling.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!filing) {
      throw new BadRequestException('Filing not found');
    }

    // If there's an approval task, use the approval service
    if (filing.approvalTaskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: filing.approvalTaskId },
      });

      if (task) {
        // Use the approval service to trigger the strategy
        await this.approvalService.processApproval({
          taskId: task.id,
          action: 'approve',
          remarks: remarks || 'Approved',
        });

        // Fetch the updated filing
        const updatedFiling = await this.prisma.payrollFiling.findUnique({
          where: { id },
          include: { account: true, approvedBy: true, file: true, shift: true },
        });

        return this.formatFilingResponse(updatedFiling);
      }
    }

    // Fallback: Direct update (for filings without approval tasks)
    const data = await this.prisma.payrollFiling.update({
      where: { id },
      data: {
        status: PayrollFilingStatus.APPROVED,
        isApproved: true,
        approvedAt: new Date(),
        approvedById: this.utilityService.accountInformation.id,
        remarks: remarks || 'Approved',
      },
    });
    return this.formatFilingResponse(data);
  }

  async rejectFiling({
    id,
    remarks,
  }: FilingActionDTO): Promise<FilingResponse> {
    // Get the filing with approval task
    const filing = await this.prisma.payrollFiling.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!filing) {
      throw new BadRequestException('Filing not found');
    }

    // If there's an approval task, use the approval service
    if (filing.approvalTaskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: filing.approvalTaskId },
      });

      if (task) {
        // Use the approval service to trigger the strategy
        await this.approvalService.processApproval({
          taskId: task.id,
          action: 'reject',
          remarks: remarks || 'Rejected',
        });

        // Fetch the updated filing
        const updatedFiling = await this.prisma.payrollFiling.findUnique({
          where: { id },
          include: { account: true, approvedBy: true, file: true, shift: true },
        });

        return this.formatFilingResponse(updatedFiling);
      }
    }

    // Fallback: Direct update (for filings without approval tasks)
    const data = await this.prisma.payrollFiling.update({
      where: { id },
      data: {
        status: PayrollFilingStatus.REJECTED,
        isApproved: false,
        rejectReason: remarks,
        approvedById: this.utilityService.accountInformation.id,
      },
    });
    return this.formatFilingResponse(data);
  }

  async getFilings(query: QueryFilingDTO): Promise<FilingsListResponse> {
    const {
      page = 0,
      limit = 10,
      status,
      accountId,
      date,
      dateFrom,
      dateTo,
      filingType,
    } = query;

    let where: any = {
      accountId: accountId || this.utilityService.accountInformation.id,
      ...(status && { status: status as PayrollFilingStatus }),
      ...(filingType && { filingType }),
    };

    // Add date range filter if provided
    if (dateFrom && dateTo) {
      const startDate = new Date(dateFrom);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);

      // For date range, we'll filter by the main date field and timeIn/timeOut for OB/COA
      if (
        filingType === PayrollFilingType.OFFICIAL_BUSINESS_FORM ||
        filingType === PayrollFilingType.CERTIFICATE_OF_ATTENDANCE
      ) {
        // For OB/COA, check both date and timeIn/timeOut
        where = {
          ...where,
          OR: [
            {
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              timeIn: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              timeOut: {
                gte: startDate,
                lte: endDate,
              },
            },
          ],
        };
      } else {
        // For other filing types, just use the date field
        where = {
          ...where,
          date: {
            gte: startDate,
            lte: endDate,
          },
        };
      }
    } else if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // For OB and COA filings, they might use timeIn/timeOut instead of date
      where = {
        AND: [
          {
            accountId: accountId || this.utilityService.accountInformation.id,
            ...(status && { status: status as PayrollFilingStatus }),
          },
          {
            OR: [
              {
                date: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
              {
                AND: [
                  {
                    filingType: {
                      in: [
                        PayrollFilingType.OFFICIAL_BUSINESS_FORM,
                        PayrollFilingType.CERTIFICATE_OF_ATTENDANCE,
                      ],
                    },
                  },
                  {
                    OR: [
                      {
                        timeIn: {
                          gte: startOfDay,
                          lte: endOfDay,
                        },
                      },
                      {
                        timeOut: {
                          gte: startOfDay,
                          lte: endOfDay,
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.payrollFiling.findMany({
        where,
        include: {
          account: true,
          approvedBy: true,
          file: true,
          shift: true,
        },
        skip: page * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payrollFiling.count({ where }),
    ]);

    const formattedData = await Promise.all(
      data.map((filing) => this.formatFilingResponse(filing)),
    );

    return { data: formattedData, total, page, limit };
  }

  async formatFilingResponse(data: any): Promise<FilingResponse> {
    const filingType = PayrollFilingTypeReference.find(
      (item) => item.key === data.filingType,
    );
    const status = PayrollFilingStatusReference.find(
      (item) => item.key === data.status,
    ) || { key: data.status, label: data.status };
    let file = undefined;
    if (data.fileId) {
      const fileData = await this.prisma.files.findUnique({
        where: { id: data.fileId },
      });
      if (fileData) {
        file = {
          id: fileData.id,
          name: fileData.name,
          url: fileData.url,
          mimetype: fileData.mimetype,
          size: fileData.size,
          originalName: fileData.originalName,
        };
      }
    }
    // Calculate time ago
    const timeAgo = this.calculateTimeAgo(data.createdAt);

    // Base response
    const baseResponse = {
      id: data.id,
      filingType,
      status,
      accountId: data.accountId,
      account: data.account,
      timeIn: data.timeIn,
      timeOut: data.timeOut,
      date: data.date,
      hours: data.hours,
      nightDifferentialHours: data.nightDifferentialHours,
      isApproved: data.isApproved,
      approvedById: data.approvedById,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      remarks: data.remarks,
      rejectReason: data.rejectReason,
      fileId: data.fileId,
      file,
      timeAgo,
      shiftData: data.shiftData,
      leaveData: data.leaveData,
      shiftId: data.shift?.id,
    };

    // Add type-specific display fields
    if (
      data.filingType === PayrollFilingType.SCHEDULE_ADJUSTMENT &&
      data.shiftData
    ) {
      baseResponse['displayFields'] = {
        shiftType: data.shiftData.shiftType,
        workingHours: this.utilityService.formatHours(
          data.shiftData.targetHours,
        ),
        breakHours: this.utilityService.formatHours(
          data.shiftData.totalBreakHours,
        ),
      };
    }

    return baseResponse;
  }

  private calculateTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - new Date(date).getTime()) / 1000,
    );

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
  }

  async getFilingShiftDetails(id: number) {
    const filing = await this.prisma.payrollFiling.findUnique({
      where: { id },
      include: {
        shift: {
          include: {
            shiftTime: true,
          },
        },
      },
    });

    if (!filing) {
      throw new NotFoundException('Filing not found');
    }

    if (
      filing.filingType !== PayrollFilingType.SCHEDULE_ADJUSTMENT ||
      !filing.shift
    ) {
      throw new NotFoundException('Shift details not found for this filing');
    }

    // Use shift configuration service to format the shift data
    const formattedShiftDetails =
      await this.shiftConfigurationService.formatShiftData(filing.shift);

    return {
      filingId: filing.id,
      shiftData: filing.shiftData,
      shiftDetails: formattedShiftDetails,
    };
  }

  /**
   * Validates if a leave filing would conflict with existing leave filings
   * IMPORTANT: This validation prevents filing ANY type of leave on the same day.
   * Employees cannot have multiple leave filings (regardless of leave type) on overlapping dates.
   *
   * @param accountId - The account ID of the employee
   * @param dateFrom - Start date of the leave
   * @param dateTo - End date of the leave
   * @param excludeFilingId - Optional filing ID to exclude (for updates)
   * @param employeeLeavePlanId - Optional employee leave plan ID for additional validations
   * @returns void - Throws BadRequestException if duplicate found or leave plan rules violated
   */
  private async validateDuplicateLeave(
    accountId: string,
    dateFrom: Date,
    dateTo: Date,
    excludeFilingId?: number,
    employeeLeavePlanId?: number,
  ): Promise<void> {
    // First, check leave plan rules if employeeLeavePlanId is provided
    if (employeeLeavePlanId) {
      const employeePlan = await this.prisma.employeeLeavePlan.findUnique({
        where: { id: employeeLeavePlanId },
        include: {
          leavePlan: {
            include: {
              leaveTypeConfiguration: true,
            },
          },
        },
      });

      if (employeePlan && employeePlan.leavePlan) {
        const leavePlan = employeePlan.leavePlan;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const leaveStartDate = new Date(dateFrom);
        leaveStartDate.setHours(0, 0, 0, 0);

        // Check same-day filing rule
        if (
          !leavePlan.canFileSameDay &&
          leaveStartDate.getTime() === today.getTime()
        ) {
          throw new BadRequestException(
            `Same-day leave filing is not allowed for ${leavePlan.leaveTypeConfiguration.name}. ` +
              `Please file your leave in advance.`,
          );
        }

        // Check advance filing days rule
        if (leavePlan.advanceFilingDays && leavePlan.advanceFilingDays > 0) {
          const minAdvanceDate = new Date(today);
          minAdvanceDate.setDate(
            minAdvanceDate.getDate() + leavePlan.advanceFilingDays,
          );

          if (leaveStartDate < minAdvanceDate) {
            throw new BadRequestException(
              `${leavePlan.leaveTypeConfiguration.name} must be filed at least ${leavePlan.advanceFilingDays} ` +
                `day${leavePlan.advanceFilingDays > 1 ? 's' : ''} in advance.`,
            );
          }
        }

        // Check maximum advance filing days
        if (
          leavePlan.maxAdvanceFilingDays &&
          leavePlan.maxAdvanceFilingDays > 0
        ) {
          const maxAdvanceDate = new Date(today);
          maxAdvanceDate.setDate(
            maxAdvanceDate.getDate() + leavePlan.maxAdvanceFilingDays,
          );

          if (leaveStartDate > maxAdvanceDate) {
            throw new BadRequestException(
              `${leavePlan.leaveTypeConfiguration.name} cannot be filed more than ${leavePlan.maxAdvanceFilingDays} ` +
                `day${leavePlan.maxAdvanceFilingDays > 1 ? 's' : ''} in advance.`,
            );
          }
        }

        // Check maximum consecutive days
        if (leavePlan.maxConsecutiveDays && leavePlan.maxConsecutiveDays > 0) {
          const daysDiff =
            Math.floor(
              (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24),
            ) + 1;

          if (daysDiff > leavePlan.maxConsecutiveDays) {
            throw new BadRequestException(
              `${leavePlan.leaveTypeConfiguration.name} cannot exceed ${leavePlan.maxConsecutiveDays} ` +
                `consecutive day${leavePlan.maxConsecutiveDays > 1 ? 's' : ''}. You requested ${daysDiff} days.`,
            );
          }
        }

        // Check late filing rule (if filing for past dates)
        if (!leavePlan.allowLateFiling && leaveStartDate < today) {
          throw new BadRequestException(
            `Late filing is not allowed for ${leavePlan.leaveTypeConfiguration.name}. ` +
              `You cannot file leave for past dates.`,
          );
        }
      }
    }

    // Build query to find overlapping leave filings
    // NOTE: We check ALL leave types to prevent any kind of leave on the same day
    const whereCondition: any = {
      accountId,
      filingType: PayrollFilingType.LEAVE,
      status: {
        in: [PayrollFilingStatus.PENDING, PayrollFilingStatus.APPROVED],
      },
    };

    // Exclude current filing if updating
    if (excludeFilingId) {
      whereCondition.id = { not: excludeFilingId };
    }

    // Find all leave filings for this user that are PENDING or APPROVED
    const existingLeaves = await this.prisma.payrollFiling.findMany({
      where: whereCondition,
      select: {
        id: true,
        date: true,
        timeIn: true,
        timeOut: true,
        status: true,
        leaveData: true,
      },
    });

    // Check for overlapping dates
    for (const existingLeave of existingLeaves) {
      // Get dates from the existing leave
      const existingStart = existingLeave.timeIn || existingLeave.date;
      const existingEnd = existingLeave.timeOut || existingLeave.date;

      if (!existingStart) continue;

      const existingStartDate = new Date(existingStart);
      const existingEndDate = new Date(existingEnd || existingStart);

      // Set times to start of day for date comparison
      existingStartDate.setHours(0, 0, 0, 0);
      existingEndDate.setHours(23, 59, 59, 999);

      const newStartDate = new Date(dateFrom);
      const newEndDate = new Date(dateTo);
      newStartDate.setHours(0, 0, 0, 0);
      newEndDate.setHours(23, 59, 59, 999);

      // Check for date overlap
      const hasOverlap =
        (newStartDate >= existingStartDate &&
          newStartDate <= existingEndDate) ||
        (newEndDate >= existingStartDate && newEndDate <= existingEndDate) ||
        (newStartDate <= existingStartDate && newEndDate >= existingEndDate);

      if (hasOverlap) {
        // Format dates for error message
        const formatDate = (date: Date) => {
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
        };

        const existingStatus = existingLeave.status.toLowerCase();

        if (existingStartDate.getTime() === existingEndDate.getTime()) {
          throw new BadRequestException(
            `You already have a ${existingStatus} leave filing on ${formatDate(existingStartDate)}. ` +
              `You cannot file multiple leaves on the same day.`,
          );
        } else {
          throw new BadRequestException(
            `The selected date range overlaps with an existing ${existingStatus} leave filing ` +
              `from ${formatDate(existingStartDate)} to ${formatDate(existingEndDate)}. ` +
              `You cannot file multiple leaves on overlapping dates.`,
          );
        }
      }
    }
  }

  async getDashboardCounters() {
    const currentDate = new Date();
    const companyId = this.utilityService.companyId;

    // Count pending filings for the current company only
    const [pendingCount, totalCount] = await Promise.all([
      this.prisma.payrollFiling.count({
        where: {
          status: PayrollFilingStatus.PENDING,
          account: {
            companyId: companyId,
          },
        },
      }),
      this.prisma.payrollFiling.count({
        where: {
          account: {
            companyId: companyId,
          },
        },
      }),
    ]);

    // Get active cutoff date ranges for the current company
    const activeCutoffs = await this.prisma.cutoffDateRange.findMany({
      where: {
        startDate: { lte: currentDate },
        endDate: { gte: currentDate },
        cutoff: {
          companyId: companyId,
          isDeleted: false,
        },
      },
      include: {
        cutoff: true,
      },
    });

    let daysBeforeCutoff = null;
    if (activeCutoffs.length > 0) {
      // Calculate days before the nearest cutoff
      const nearestEndDate = activeCutoffs.reduce((nearest, current) => {
        return current.endDate < nearest.endDate ? current : nearest;
      }).endDate;
      daysBeforeCutoff = Math.ceil(
        (nearestEndDate.getTime() - currentDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
    }

    return {
      pendingApprovals: {
        current: pendingCount,
        total: totalCount,
      },
      daysBeforeCutoff: daysBeforeCutoff,
      pendingProcessing: 0,
    };
  }

  async getAllFilings(query: QueryFilingDTO) {
    const {
      page = 1,
      limit = 100,
      status,
      dateFrom,
      dateTo,
      cutoffDateRangeId,
    } = query;
    const skip = (page - 1) * limit;
    const companyId = this.utilityService.companyId;

    const where: any = {
      // Always filter by company ID
      account: {
        companyId: companyId,
      },
    };

    // Add status filter if provided
    if (status) {
      where.status = status.toUpperCase() as PayrollFilingStatus;
    }

    // Add cutoff date range filter if provided
    if (cutoffDateRangeId) {
      const cutoffDateRange = await this.prisma.cutoffDateRange.findUnique({
        where: { id: cutoffDateRangeId },
        include: { cutoff: true },
      });

      if (cutoffDateRange) {
        // Filter by both date range AND the specific cutoff
        // This ensures only employees from the same payroll group (cutoff) are shown
        where.date = {
          gte: cutoffDateRange.startDate,
          lte: cutoffDateRange.endDate,
        };

        // Also filter by accounts that belong to payroll groups using this cutoff
        // Merge with existing account filter to maintain company ID filtering
        where.account = {
          ...where.account,
          EmployeeData: {
            payrollGroup: {
              cutoffId: cutoffDateRange.cutoffId,
            },
          },
        };
      }
    }
    // Add date range filter if provided (only if cutoffDateRangeId is not set)
    else if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    // Get total count first
    const totalCount = await this.prisma.payrollFiling.count({ where });

    // Get all filings with proper pagination
    const filings = await this.prisma.payrollFiling.findMany({
      where,
      skip,
      take: limit,
      include: {
        account: {
          include: {
            parent: true,
            EmployeeData: {
              include: {
                payrollGroup: {
                  include: {
                    cutoff: true,
                  },
                },
              },
            },
          },
        },
        approvedBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get counts by type for the breakdown
    const [
      overtimeCount,
      leaveCount,
      scheduleCount,
      businessCount,
      attendanceCount,
    ] = await Promise.all([
      this.prisma.payrollFiling.count({
        where: { ...where, filingType: PayrollFilingType.OVERTIME },
      }),
      this.prisma.payrollFiling.count({
        where: { ...where, filingType: PayrollFilingType.LEAVE },
      }),
      this.prisma.payrollFiling.count({
        where: { ...where, filingType: PayrollFilingType.SCHEDULE_ADJUSTMENT },
      }),
      this.prisma.payrollFiling.count({
        where: {
          ...where,
          filingType: PayrollFilingType.OFFICIAL_BUSINESS_FORM,
        },
      }),
      this.prisma.payrollFiling.count({
        where: {
          ...where,
          filingType: PayrollFilingType.CERTIFICATE_OF_ATTENDANCE,
        },
      }),
    ]);

    // Process filings and add filing type labels
    const processedFilings = filings.map((filing) => {
      let filingTypeLabel = '';
      const additionalData: any = { ...filing };

      switch (filing.filingType) {
        case PayrollFilingType.OVERTIME:
          filingTypeLabel = 'Overtime';
          break;
        case PayrollFilingType.LEAVE:
          filingTypeLabel = 'Leave';
          // Extract dateFrom and dateTo from leaveData if available
          const leaveData = filing.leaveData as any;
          if (leaveData) {
            additionalData.dateFrom = leaveData.dateFrom || filing.date;
            additionalData.dateTo = leaveData.dateTo || filing.date;
          }
          break;
        case PayrollFilingType.SCHEDULE_ADJUSTMENT:
          filingTypeLabel = 'Schedule Adjustment';
          break;
        case PayrollFilingType.OFFICIAL_BUSINESS_FORM:
          filingTypeLabel = 'Official Business';
          break;
        case PayrollFilingType.CERTIFICATE_OF_ATTENDANCE:
          filingTypeLabel = 'Certificate of Attendance';
          break;
      }

      return {
        ...additionalData,
        filingTypeLabel,
      };
    });

    return {
      data: processedFilings,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        breakdown: {
          overtime: overtimeCount,
          leave: leaveCount,
          scheduleAdjustment: scheduleCount,
          officialBusiness: businessCount,
          certificateOfAttendance: attendanceCount,
        },
      },
    };
  }
}
