import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  EmploymentDetailsResponse,
  JobDetailsResponse,
  ShiftDetailsResponse,
  AllowancesResponse,
  DocumentsResponse,
  ContractDetailsResponse,
  GovernmentIdsResponse,
  LeavesResponse,
  DeductionsResponse,
  TimesheetResponse,
} from './employee-current.interface';

@Injectable()
export class EmployeeCurrentService {
  @Inject() private prisma: PrismaService;
  @Inject() private utilityService: UtilityService;

  private async getCurrentEmployee(accountId: string) {
    const employee = await this.prisma.employeeData.findUnique({
      where: { accountId },
      include: {
        account: true,
        payrollGroup: true,
        branch: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee data not found');
    }

    return employee;
  }

  async getEmploymentDetails(accountId: string): Promise<EmploymentDetailsResponse> {
    const employee = await this.getCurrentEmployee(accountId);

    return {
      employeeCode: employee.employeeCode || '',
      personalInfo: {
        firstName: employee.account.firstName,
        lastName: employee.account.lastName,
        middleName: employee.account.middleName,
        dateOfBirth: employee.account.dateOfBirth?.toISOString().split('T')[0],
        civilStatus: employee.account.civilStatus,
        gender: employee.account.gender,
      },
      contactInfo: {
        email: employee.account.email,
        contactNumber: employee.account.contactNumber,
        address: [employee.account.street, employee.account.city, employee.account.stateProvince, employee.account.country, employee.account.postalCode].filter(Boolean).join(', ') || 'N/A',
      },
      workAssignment: {
        department: 'N/A', // Would need to be fetched from separate table
        position: 'N/A', // Would need to be fetched from separate table
        branch: employee.branch?.name,
        employmentStatus: employee.isActive ? 'Active' : 'Inactive',
        dateHired: employee.createdAt, // Using createdAt as proxy for hire date
      },
    };
  }

  async getJobDetails(accountId: string): Promise<JobDetailsResponse> {
    const employee = await this.getCurrentEmployee(accountId);

    return {
      bankingInfo: {
        bankName: employee.bankName,
        accountNumber: employee.bankAccountNumber ? 
          `****${employee.bankAccountNumber.slice(-4)}` : undefined,
        accountName: employee.account.firstName + ' ' + employee.account.lastName,
      },
      salaryInfo: {
        basicSalary: 0, // Would need to be fetched from contract
        salaryGrade: 'N/A',
        payrollGroup: employee.payrollGroup?.payrollGroupCode,
        paymentMethod: 'Bank Transfer',
      },
      employmentInfo: {
        employmentType: 'Regular',
        jobTitle: 'N/A',
        jobLevel: 'N/A',
        reportingTo: 'N/A',
      },
    };
  }

  async getShiftDetails(accountId: string): Promise<ShiftDetailsResponse> {
    const employee = await this.getCurrentEmployee(accountId);
    
    // Simplified response - would need schedule assignment tables
    return {
      currentShift: {
        shiftName: 'Regular Shift',
        startTime: '09:00',
        endTime: '18:00',
        breakDuration: 60,
      },
      weeklySchedule: [
        { day: 'Monday', startTime: '09:00', endTime: '18:00', isRestDay: false },
        { day: 'Tuesday', startTime: '09:00', endTime: '18:00', isRestDay: false },
        { day: 'Wednesday', startTime: '09:00', endTime: '18:00', isRestDay: false },
        { day: 'Thursday', startTime: '09:00', endTime: '18:00', isRestDay: false },
        { day: 'Friday', startTime: '09:00', endTime: '18:00', isRestDay: false },
        { day: 'Saturday', startTime: '09:00', endTime: '18:00', isRestDay: true },
        { day: 'Sunday', startTime: '09:00', endTime: '18:00', isRestDay: true },
      ],
      scheduleAssignment: {
        effectiveDate: new Date(),
        scheduleType: 'Regular',
      },
    };
  }

  async getAllowances(accountId: string): Promise<AllowancesResponse> {
    const employee = await this.getCurrentEmployee(accountId);
    
    // Simplified - would need allowance plan tables
    return {
      allowances: [],
      totalMonthlyAllowance: 0,
    };
  }

  async getDocuments(accountId: string): Promise<DocumentsResponse> {
    const employee = await this.getCurrentEmployee(accountId);
    
    // Simplified - would need document tables
    return {
      documents: [],
      totalDocuments: 0,
    };
  }

  async getContractDetails(accountId: string): Promise<ContractDetailsResponse> {
    const employee = await this.getCurrentEmployee(accountId);
    
    const contract = await this.prisma.employeeContract.findUnique({
      where: { id: employee.activeContractId },
    });
    
    return {
      currentContract: contract ? {
        contractNumber: `CTR-${contract.id.toString().padStart(6, '0')}`,
        contractType: contract.employmentStatus,
        startDate: contract.startDate,
        endDate: contract.endDate,
        status: contract.isActive ? 'Active' : 'Inactive',
        terms: `Monthly Rate: ${contract.monthlyRate}`,
      } : {
        status: 'No contract found',
      },
      contractHistory: [],
    };
  }

  async getGovernmentIds(accountId: string): Promise<GovernmentIdsResponse> {
    const employee = await this.getCurrentEmployee(accountId);
    
    return {
      tin: employee.tinNumber ? `****-***-${employee.tinNumber.slice(-3)}` : undefined,
      sss: employee.sssNumber ? `**-*******-${employee.sssNumber.slice(-1)}` : undefined,
      hdmf: employee.hdmfNumber ? `****-****-${employee.hdmfNumber.slice(-4)}` : undefined,
      phic: employee.phicNumber ? `**-*********-${employee.phicNumber.slice(-1)}` : undefined,
      otherIds: [],
    };
  }

  async getLeaves(accountId: string): Promise<LeavesResponse> {
    const employee = await this.getCurrentEmployee(accountId);
    
    // Simplified - would need leave balance tables
    return {
      leaveBalances: [
        {
          leaveType: 'Vacation Leave',
          totalDays: 15,
          usedDays: 5,
          remainingDays: 10,
          expiryDate: new Date('2025-12-31'),
        },
        {
          leaveType: 'Sick Leave',
          totalDays: 15,
          usedDays: 2,
          remainingDays: 13,
          expiryDate: new Date('2025-12-31'),
        },
      ],
      leaveHistory: [],
    };
  }

  async getDeductions(accountId: string): Promise<DeductionsResponse> {
    const employee = await this.getCurrentEmployee(accountId);
    
    // Simplified - would need deduction plan tables
    return {
      regularDeductions: [
        {
          id: 1,
          name: 'SSS',
          amount: 1000,
          frequency: 'Monthly',
          status: 'Active',
        },
        {
          id: 2,
          name: 'PhilHealth',
          amount: 500,
          frequency: 'Monthly',
          status: 'Active',
        },
        {
          id: 3,
          name: 'Pag-IBIG',
          amount: 200,
          frequency: 'Monthly',
          status: 'Active',
        },
      ],
      loans: [],
      totalMonthlyDeduction: 1700,
    };
  }

  async getTimesheet(accountId: string): Promise<TimesheetResponse> {
    const employee = await this.getCurrentEmployee(accountId);
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Simplified - would need time log tables
    return {
      currentPeriod: {
        startDate: startOfMonth,
        endDate: endOfMonth,
        totalHours: 160,
        overtimeHours: 8,
        lateMinutes: 15,
        undertime: 0,
      },
      recentLogs: [
        {
          date: new Date(),
          timeIn: '09:00',
          timeOut: '18:00',
          breakIn: '12:00',
          breakOut: '13:00',
          totalHours: 8,
          status: 'Present',
        },
      ],
      attendanceSummary: {
        present: 20,
        absent: 0,
        late: 2,
        onLeave: 1,
      },
    };
  }
}