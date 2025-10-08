import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { PrismaService } from '@common/prisma.service';
import {
  Prisma,
  EmployeeData,
  EmployeeContract,
  ShiftPurpose,
} from '@prisma/client';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import {
  EmployeeCreateDTO,
  EmployeeUpdateDTO,
  EmployeeDeleteDTO,
  EmployeeRestoreDTO,
  EmployeeConctractDetailsDTO,
  EmployeeJobDetailsUpdateDTO,
  EmployeeGovernmentDetailsUpdateDTO,
  EmployeeScheduleUpdateDTO,
} from './employee-list.interface';
import { AccountService } from '@modules/account/account/account.service';
import { ContractDataResponse } from '../../../../shared/response/contract.response';
import { FileUploadService } from '@infrastructure/file-upload/file-upload/file-upload.service';
import {
  AccountCreateDTO,
  AccountUpdateDTO,
} from '@modules/account/account/account.validator';
import { AccountDataResponse } from '../../../../shared/response/account.response';
import { PayrollGroupConfigurationService } from '@modules/hr/configuration/payroll-group-configuration/payroll-group-configuration.service';
import { ScheduleConfigurationService } from '@modules/hr/configuration/schedule-configuration/schedule-configuration.service';
import { ScheduleDataResponse } from '../../../../shared/response/schedule.response';
import { BranchService } from '@modules/location/branch/branch/branch.service';
import { BranchDataResponse } from '../../../../shared/response/branch.response';
import { EmployeeDataResponse } from '../../../../shared/response/employee.response';
import { PayrollGroupDataResponse } from '../../../../shared/response/payroll-group.response';
import employmentStatusReference from '../../../../reference/employment-status.reference';
import { EmploymentStatusReference } from '../../../../shared/response/contract.response';
import { ExcelExportService } from '@common/services/excel-export.service';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class EmployeeListService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject() public accountService: AccountService;
  @Inject() private readonly fileUploadService: FileUploadService;
  @Inject()
  public payrollGroupConfigurationService: PayrollGroupConfigurationService;
  @Inject() public scheduleConfigurationService: ScheduleConfigurationService;
  @Inject() public branchService: BranchService;
  @Inject() private readonly excelExportService: ExcelExportService;

  async info(accountId: string): Promise<EmployeeDataResponse> {
    const response = await this.prisma.employeeData.findUnique({
      where: { accountId },
    });

    if (!response) {
      throw new BadRequestException('Employee data not found.');
    }

    const formattedResponse = await this.formatResponse(response);
    return formattedResponse;
  }

  async getEmployeeListByPayrollByCutoff(
    cutoffId: number,
  ): Promise<EmployeeData[]> {
    const employeeList: EmployeeData[] =
      await this.prisma.employeeData.findMany({
        where: {
          payrollGroup: {
            cutoffId: cutoffId,
          },
          account: {
            companyId: this.utilityService.companyId,
          },
        },
        orderBy: {
          account: {
            lastName: 'asc',
          },
        },
      });

    return employeeList;
  }

  async getEmployeeListByPayrollByCutoffForAllCompanies(
    cutoffId: number,
  ): Promise<EmployeeData[]> {
    const employeeList: EmployeeData[] =
      await this.prisma.employeeData.findMany({
        where: {
          payrollGroup: {
            cutoffId: cutoffId,
          },
          // NO company filter here - process all companies
        },
        orderBy: {
          account: {
            lastName: 'asc',
          },
        },
      });

    return employeeList;
  }

  async employeeTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'employeeData');
    const tableQuery = this.tableHandlerService.constructTableQuery();

    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      ...tableQuery['where'],
      account: {
        ...((tableQuery['where'] as any)?.account || {}),
        companyId: this.utilityService.companyId,
      },
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.employeeData,
      query,
      tableQuery,
    );
    const formattedList: EmployeeDataResponse[] = await Promise.all(
      baseList.map(async (employeeData: EmployeeData) => {
        return await this.formatResponse(employeeData);
      }),
    );

    return { list: formattedList, pagination, currentPage };
  }

  async add(params: EmployeeCreateDTO) {
    params = await this.basicFormattingBeforeSaving(params);
    // Uniqueness check for create and update
    const existing = await this.prisma.employeeData.findFirst({
      where: {
        employeeCode: params.employeeCode,
        account: { companyId: this.utilityService.companyId },
      },
      include: { account: true },
    });

    if (existing) {
      throw new BadRequestException('Employee code has already been used.');
    }

    let account;

    if (params.existingAccountId) {
      // Activating existing account - verify it exists and has no employee data
      account = await this.accountService.getAccountInformation({
        id: params.existingAccountId,
      });
      if (!account) {
        throw new BadRequestException('Account not found.');
      }

      const existingEmployee = await this.prisma.employeeData.findFirst({
        where: { accountId: params.existingAccountId },
      });
      if (existingEmployee) {
        throw new BadRequestException('Account already has employee data.');
      }
    } else {
      // Creating new account - require account details
      if (!params.accountDetails) {
        throw new BadRequestException(
          'Account details are required when creating a new employee.',
        );
      }
      const accountCreate: AccountCreateDTO = params.accountDetails;
      account = await this.accountService.createAccount(accountCreate);
    }

    // Only validate contract file if one is provided
    if (params.contractDetails.contractFileId) {
      const contractFile = await this.prisma.files.findFirst({
        where: { id: params.contractDetails.contractFileId },
      });
      if (!contractFile) {
        throw new BadRequestException('Contract file not found');
      }
    }

    const contractInformation = await this.addContract(
      account.id,
      params.contractDetails,
    );

    // create employee data
    const employeeDataCreateInput: Prisma.EmployeeDataCreateInput = {
      employeeCode: params.employeeCode,
      bankName: params.bankName || null,
      bankAccountNumber: params.bankAccountNumber || null,
      tinNumber: params.tinNumber || null,
      sssNumber: params.sssNumber || null,
      hdmfNumber: params.hdmfNumber || null,
      phicNumber: params.phicNumber || null,
      account: {
        connect: {
          id: account.id,
        },
      },
      payrollGroup: {
        connect: {
          id: params.payrollGroupId,
        },
      },
      activeContract: {
        connect: {
          id: contractInformation.id,
        },
      },
      schedule: {
        connect: {
          id: params.scheduleId,
        },
      },
      branch: {
        connect: {
          id: params.branchId,
        },
      },
    };

    const employeeData = await this.prisma.employeeData.create({
      data: employeeDataCreateInput,
    });

    return await this.formatResponse(employeeData);
  }

  async edit(params: EmployeeUpdateDTO) {
    params = (await this.basicFormattingBeforeSaving(
      params,
    )) as EmployeeUpdateDTO;
    // Uniqueness check for update
    const existing = await this.prisma.employeeData.findFirst({
      where: {
        employeeCode: params.employeeCode,
        account: { companyId: this.utilityService.companyId },
      },
      include: { account: true },
    });
    if (existing && existing.accountId !== params.accountId) {
      throw new BadRequestException(
        'Employee code must be unique within the company.',
      );
    }

    const accountUpdate: AccountUpdateDTO = {
      id: params.accountId,
      firstName: params.accountDetails.firstName,
      lastName: params.accountDetails.lastName,
      middleName: params.accountDetails.middleName,
      email: params.accountDetails.email,
      username: params.accountDetails.username,
      contactNumber: params.accountDetails.contactNumber,
      roleID: params.accountDetails.roleID,
      ...(params.accountDetails.parentAccountId && {
        parentAccountId: params.accountDetails.parentAccountId,
      }),
      ...(params.accountDetails.dateOfBirth !== undefined && {
        dateOfBirth: params.accountDetails.dateOfBirth,
      }),
      ...(params.accountDetails.gender !== undefined && {
        gender: params.accountDetails.gender,
      }),
      ...(params.accountDetails.civilStatus !== undefined && {
        civilStatus: params.accountDetails.civilStatus,
      }),
      ...(params.accountDetails.street !== undefined && {
        street: params.accountDetails.street,
      }),
      ...(params.accountDetails.city !== undefined && {
        city: params.accountDetails.city,
      }),
      ...(params.accountDetails.stateProvince !== undefined && {
        stateProvince: params.accountDetails.stateProvince,
      }),
      ...(params.accountDetails.postalCode !== undefined && {
        postalCode: params.accountDetails.postalCode,
      }),
      ...(params.accountDetails.zipCode !== undefined && {
        zipCode: params.accountDetails.zipCode,
      }),
      ...(params.accountDetails.country !== undefined && {
        country: params.accountDetails.country,
      }),
    };

    const account: AccountDataResponse =
      await this.accountService.updateAccount(accountUpdate);
    const originalEmployeeData = await this.prisma.employeeData.findFirst({
      where: { accountId: params.accountId },
    });

    const employeeDataCreateInput: Prisma.EmployeeDataCreateInput = {
      employeeCode: params.employeeCode,
      bankName: params.bankName || originalEmployeeData.bankName,
      bankAccountNumber:
        params.bankAccountNumber || originalEmployeeData.bankAccountNumber,
      tinNumber: params.tinNumber || originalEmployeeData.tinNumber,
      sssNumber: params.sssNumber || originalEmployeeData.sssNumber,
      hdmfNumber: params.hdmfNumber || originalEmployeeData.hdmfNumber,
      phicNumber: params.phicNumber || originalEmployeeData.phicNumber,
      activeContract: {
        connect: {
          id: originalEmployeeData.activeContractId,
        },
      },
      account: {
        connect: {
          id: account.id,
        },
      },
      payrollGroup: {
        connect: {
          id: params.payrollGroupId,
        },
      },
      schedule: {
        connect: {
          id: params.scheduleId,
        },
      },
      branch: {
        connect: {
          id: params.branchId,
        },
      },
    };

    const employeeData = await this.prisma.employeeData.update({
      where: {
        accountId: params.accountId,
      },
      data: employeeDataCreateInput,
    });

    return { account, employeeData };
  }

  async basicFormattingBeforeSaving(
    params: EmployeeCreateDTO | EmployeeUpdateDTO,
  ) {
    if (params.accountDetails) {
      params.accountDetails.firstName = params.accountDetails.firstName
        .trim()
        .toLowerCase();
      params.accountDetails.lastName = params.accountDetails.lastName
        .trim()
        .toLowerCase();

      params.accountDetails.middleName = params.accountDetails.middleName
        ? params.accountDetails.middleName.trim().toLowerCase()
        : '';
      params.accountDetails.email = params.accountDetails.email
        .trim()
        .toLowerCase();
      params.accountDetails.username = params.accountDetails.username
        .trim()
        .toLowerCase();
    }

    if (params.contractDetails) {
      params.contractDetails.monthlyRate = Number(
        params.contractDetails.monthlyRate,
      );
      params.contractDetails.startDate = params.contractDetails.startDate;
      params.contractDetails.endDate = params.contractDetails.endDate;
    }
    return params;
  }

  async formatResponse(
    employeeData: EmployeeData,
    isIncludeContract = true,
    isIncludePayrollGroup = true,
    isIncludeSchedule = true,
    isIncludeBranch = true,
  ): Promise<EmployeeDataResponse> {
    const accountInformation: AccountDataResponse =
      await this.accountService.getAccountInformation({
        id: employeeData.accountId,
      });

    let employeeContractRaw: EmployeeContract;
    let payrollGroup: PayrollGroupDataResponse;
    let schedule: ScheduleDataResponse;
    let branch: BranchDataResponse;

    if (isIncludeContract) {
      employeeContractRaw = await this.prisma.employeeContract.findFirst({
        where: {
          id: employeeData.activeContractId,
        },
      });
    }

    if (isIncludePayrollGroup) {
      payrollGroup = await this.payrollGroupConfigurationService.getInfo(
        employeeData.payrollGroupId,
      );
    }

    if (isIncludeSchedule) {
      schedule = await this.scheduleConfigurationService.getScheduleInfo({
        id: employeeData.scheduleId.toString(),
      });
    }

    if (isIncludeBranch) {
      branch = await this.branchService.getBranchInformation(
        employeeData.branchId.toString(),
      );
    }

    const formattedResponse: EmployeeDataResponse = {
      employeeCode: employeeData.employeeCode,
      accountDetails: accountInformation,
      contractDetails: isIncludeContract
        ? await this.toContractResponseDTO(employeeContractRaw)
        : null,
      payrollGroup: isIncludePayrollGroup ? payrollGroup : null,
      schedule: isIncludeSchedule ? schedule : null,
      branch: isIncludeBranch ? branch : null,
      jobDetails: {
        bankName: employeeData.bankName,
        bankAccountNumber: employeeData.bankAccountNumber,
        biometricsNumber: employeeData.biometricsNumber,
      },
      governmentDetails: {
        tinNumber: employeeData.tinNumber,
        sssNumber: employeeData.sssNumber,
        hdmfNumber: employeeData.hdmfNumber,
        phicNumber: employeeData.phicNumber,
      },
    };

    return formattedResponse;
  }

  async getContractById() {}

  async delete(params: EmployeeDeleteDTO) {
    const employee = await this.prisma.employeeData.findUnique({
      where: { accountId: params.accountId },
    });
    if (!employee) {
      throw new BadRequestException('Employee not found.');
    }
    const updated = await this.prisma.employeeData.update({
      where: { accountId: params.accountId },
      data: { isActive: false },
    });
    return {
      message: 'Employee set as inactive successfully',
      employee: updated,
    };
  }

  async restore(params: EmployeeRestoreDTO) {
    const employee = await this.prisma.employeeData.findUnique({
      where: { accountId: params.accountId },
    });
    if (!employee) {
      throw new BadRequestException('Employee not found.');
    }
    const updated = await this.prisma.employeeData.update({
      where: { accountId: params.accountId },
      data: { isActive: true },
    });
    return { message: 'Employee restored successfully', employee: updated };
  }

  async addContract(
    accountId: string,
    contractData: EmployeeConctractDetailsDTO,
  ): Promise<ContractDataResponse> {
    if (contractData.contractFileId) {
      const contractFile = await this.prisma.files.findFirst({
        where: { id: contractData.contractFileId },
      });

      if (!contractFile) {
        throw new BadRequestException('Contract file not found');
      }
    }

    if (contractData.employmentStatus === 'REGULAR') {
      contractData.endDate = null;
    }

    const contract = await this.prisma.employeeContract.create({
      data: {
        account: { connect: { id: accountId } },
        startDate: new Date(contractData.startDate),
        endDate: contractData.endDate ? new Date(contractData.endDate) : null,
        employmentStatus: contractData.employmentStatus,
        monthlyRate: Number(contractData.monthlyRate),
      },
    });

    if (contractData.contractFileId) {
      await this.prisma.employeeContract.update({
        where: { id: contract.id },
        data: {
          contractFile: { connect: { id: contractData.contractFileId } },
        },
      });
    }

    // if the start date is today, then set the contract as active
    const employeeData = await this.prisma.employeeData.findUnique({
      where: { accountId },
    });

    if (employeeData && new Date(contractData.startDate) <= new Date()) {
      console.log('employeeData:', employeeData);
      console.log('contractData.startDate:', contractData.startDate);
      console.log('new Date().toDateString():', new Date().toDateString());
      await this.prisma.employeeData.update({
        where: { accountId },
        data: { activeContract: { connect: { id: contract.id } } },
      });
    }

    return this.toContractResponseDTO(contract);
  }

  async editContract(
    contractId: number,
    contractData: EmployeeConctractDetailsDTO,
  ): Promise<ContractDataResponse> {
    if (contractData.employmentStatus === 'REGULAR') {
      contractData.endDate = null;
    }
    const contract = await this.prisma.employeeContract.update({
      where: { id: contractId },
      data: {
        startDate: new Date(contractData.startDate),
        endDate: contractData.endDate ? new Date(contractData.endDate) : null,
        employmentStatus: contractData.employmentStatus,
        monthlyRate: Number(contractData.monthlyRate),
        contractFileId: contractData.contractFileId,
      },
    });
    return this.toContractResponseDTO(contract);
  }

  async setContractInactive(contractId: number): Promise<ContractDataResponse> {
    const contract = await this.prisma.employeeContract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new BadRequestException('Contract not found');
    }

    const employeeData = await this.prisma.employeeData.findUnique({
      where: { accountId: contract.accountId },
    });

    if (employeeData && employeeData.activeContractId === contractId) {
      throw new BadRequestException('Cannot delete active contract');
    }

    await this.prisma.employeeContract.update({
      where: { id: contractId },
      data: { isActive: false },
    });

    return this.toContractResponseDTO(contract);
  }

  async getContractsByAccountId(
    accountId: string,
  ): Promise<ContractDataResponse[]> {
    const contracts = await this.prisma.employeeContract.findMany({
      where: {
        accountId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return await Promise.all(
      contracts.map((contract) => this.toContractResponseDTO(contract)),
    );
  }

  async getEmploymentStatusReference(): Promise<EmploymentStatusReference[]> {
    return employmentStatusReference;
  }

  async toContractResponseDTO(contract: any): Promise<ContractDataResponse> {
    let contractFile = null;

    // Safely fetch contract file, handle case where file doesn't exist
    if (contract.contractFileId) {
      try {
        contractFile = await this.fileUploadService.getFileInformation(
          contract.contractFileId,
        );
      } catch (error) {
        // File not found or other error - log and continue with null
        this.utilityService.log(
          `Contract file not found for contractFileId: ${contract.contractFileId}`,
        );
        contractFile = null;
      }
    }

    const employeeInformation = await this.prisma.employeeData.findUnique({
      where: { accountId: contract.accountId },
    });

    return {
      id: contract.id,
      accountId: contract.accountId,
      startDate: this.utilityService.formatDate(contract.startDate),
      endDate: this.utilityService.formatDate(contract.endDate),
      employmentStatus: employmentStatusReference.find(
        (status) => status.key === contract.employmentStatus,
      ),
      monthlyRate: this.utilityService.formatCurrency(contract.monthlyRate),
      contractFileId: contract.contractFileId,
      contractFile: contractFile,
      isActive: contract.isActive,
      isEmployeeActiveContract:
        employeeInformation &&
        employeeInformation.activeContractId === contract.id,
      createdAt: this.utilityService.formatDate(contract.createdAt),
      updatedAt: this.utilityService.formatDate(contract.updatedAt),
    };
  }

  async exportEmployeesToExcel(): Promise<Buffer> {
    // Fetch all employees with their related data
    const employees = await this.prisma.employeeData.findMany({
      where: {
        account: {
          companyId: this.utilityService.companyId,
        },
      },
      include: {
        account: {
          include: {
            role: true,
            parent: true,
          },
        },
        payrollGroup: true,
        schedule: true,
        branch: true,
        activeContract: true,
      },
      orderBy: {
        account: {
          lastName: 'asc',
        },
      },
    });

    // Get dropdown options
    const roles = await this.prisma.role.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isDeleted: false,
      },
      orderBy: { name: 'asc' },
    });

    const payrollGroups = await this.prisma.payrollGroup.findMany({
      where: {
        company: {
          id: this.utilityService.companyId,
        },
        isDeleted: false,
      },
      orderBy: { payrollGroupCode: 'asc' },
    });

    const schedules = await this.prisma.schedule.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isDeleted: false,
      },
      orderBy: { scheduleCode: 'asc' },
    });

    const branches = await this.prisma.project.findMany({
      where: {
        companyId: this.utilityService.companyId,
        status: ProjectStatus.BRANCH,
        isDeleted: false,
      },
      orderBy: { name: 'asc' },
    });

    // Define columns for Excel (widths will be auto-calculated based on header text)
    const columns = [
      { header: 'Employee Code', key: 'employeeCode' },
      { header: 'Last Name', key: 'lastName' },
      { header: 'First Name', key: 'firstName' },
      { header: 'Middle Name (Optional)', key: 'middleName' },
      { header: 'Username', key: 'username' },
      { header: 'Email Address', key: 'email' },
      { header: 'Birthdate (yyyy/mm/dd)', key: 'birthdate' },
      { header: 'Civil Status', key: 'civilStatus' },
      { header: 'Sex', key: 'sex' },
      { header: 'Street', key: 'street' },
      { header: 'City / Town', key: 'city' },
      { header: 'State / Province', key: 'stateProvince' },
      { header: 'Postal Code', key: 'postalCode' },
      { header: 'ZIP Code', key: 'zipCode' },
      { header: 'Country', key: 'country' },
      { header: 'Contact Number', key: 'contactNumber' },
      { header: 'Role/Position', key: 'role' },
      { header: 'Reports To (Employee Code)', key: 'reportsTo' },
      { header: 'Monthly Rate', key: 'monthlyRate' },
      { header: 'Employment Status', key: 'employmentStatus' },
      { header: 'Start Date', key: 'startDate' },
      { header: 'End Date', key: 'endDate' },
      { header: 'Branch', key: 'branch' },
      { header: 'Bank Name', key: 'bankName' },
      { header: 'Bank Account Number', key: 'bankAccountNumber' },
      { header: 'Schedule Code', key: 'scheduleCode' },
      { header: 'Payroll Group Code', key: 'payrollGroupCode' },
      { header: 'TIN Number', key: 'tinNumber' },
      { header: 'SSS Number', key: 'sssNumber' },
      { header: 'HDMF Number', key: 'hdmfNumber' },
      { header: 'PHC Number', key: 'phcNumber' },
    ];

    // Format data for Excel
    const data = await Promise.all(
      employees.map(async (employee) => {
        let reportsToEmployeeCode = '';
        if (employee.account.parentAccountId) {
          const parentEmployee = await this.prisma.employeeData.findUnique({
            where: { accountId: employee.account.parentAccountId },
          });
          if (parentEmployee) {
            reportsToEmployeeCode = parentEmployee.employeeCode;
          }
        }

        const employmentStatus = employmentStatusReference.find(
          (status) => status.key === employee.activeContract?.employmentStatus,
        );

        return {
          employeeCode: employee.employeeCode,
          lastName: employee.account.lastName,
          firstName: employee.account.firstName,
          middleName: employee.account.middleName || '',
          username: employee.account.username,
          email: employee.account.email,
          birthdate: employee.account.dateOfBirth
            ? this.utilityService.formatDate(employee.account.dateOfBirth)
            : '',
          civilStatus: '',
          sex: employee.account.gender || '',
          street: '',
          city: '',
          stateProvince: '',
          postalCode: '',
          zipCode: '',
          country: '',
          contactNumber: employee.account.contactNumber,
          role: employee.account.role?.name || '',
          reportsTo: reportsToEmployeeCode,
          monthlyRate: employee.activeContract?.monthlyRate || 0,
          employmentStatus: employmentStatus?.label || '',
          startDate: employee.activeContract?.startDate
            ? this.utilityService.formatDate(employee.activeContract.startDate)
            : '',
          endDate: employee.activeContract?.endDate
            ? this.utilityService.formatDate(employee.activeContract.endDate)
            : '',
          branch: employee.branch?.name || '',
          bankName: employee.bankName || '',
          bankAccountNumber: employee.bankAccountNumber || '',
          scheduleCode: employee.schedule?.scheduleCode || '',
          payrollGroupCode: employee.payrollGroup?.payrollGroupCode || '',
          tinNumber: employee.tinNumber || '',
          sssNumber: employee.sssNumber || '',
          hdmfNumber: employee.hdmfNumber || '',
          phcNumber: employee.phicNumber || '',
        };
      }),
    );

    // Prepare dropdown options
    const dropdowns = [
      {
        columnKey: 'role',
        options: roles.map((role) => role.name),
      },
      {
        columnKey: 'payrollGroupCode',
        options: payrollGroups.map((pg) => pg.payrollGroupCode),
      },
      {
        columnKey: 'scheduleCode',
        options: schedules.map((schedule) => schedule.scheduleCode),
      },
      {
        columnKey: 'branch',
        options: branches.map((branch) => branch.name),
      },
    ];

    // Define date columns
    const dateColumns = ['startDate', 'endDate'];

    // Generate Excel file
    return await this.excelExportService.exportToExcel(
      columns,
      data,
      'Employees',
      dropdowns,
      dateColumns,
    );
  }

  async downloadEmployeeTemplate(): Promise<Buffer> {
    // Get dropdown options
    const roles = await this.prisma.role.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isDeleted: false,
      },
      orderBy: { name: 'asc' },
    });

    const payrollGroups = await this.prisma.payrollGroup.findMany({
      where: {
        company: {
          id: this.utilityService.companyId,
        },
        isDeleted: false,
      },
      orderBy: { payrollGroupCode: 'asc' },
    });

    const schedules = await this.prisma.schedule.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isDeleted: false,
      },
      orderBy: { scheduleCode: 'asc' },
    });

    const branches = await this.prisma.project.findMany({
      where: {
        companyId: this.utilityService.companyId,
        status: ProjectStatus.BRANCH,
        isDeleted: false,
      },
      orderBy: { name: 'asc' },
    });

    // Define columns for Excel (widths will be auto-calculated based on header text)
    const columns = [
      { header: 'Employee Code', key: 'employeeCode' },
      { header: 'Last Name', key: 'lastName' },
      { header: 'First Name', key: 'firstName' },
      { header: 'Middle Name (Optional)', key: 'middleName' },
      { header: 'Username', key: 'username' },
      { header: 'Email Address', key: 'email' },
      { header: 'Birthdate (yyyy/mm/dd)', key: 'birthdate' },
      { header: 'Civil Status', key: 'civilStatus' },
      { header: 'Sex', key: 'sex' },
      { header: 'Street', key: 'street' },
      { header: 'City / Town', key: 'city' },
      { header: 'State / Province', key: 'stateProvince' },
      { header: 'Postal Code', key: 'postalCode' },
      { header: 'ZIP Code', key: 'zipCode' },
      { header: 'Country', key: 'country' },
      { header: 'Contact Number', key: 'contactNumber' },
      { header: 'Role/Position', key: 'role' },
      { header: 'Reports To (Employee Code)', key: 'reportsTo' },
      { header: 'Monthly Rate', key: 'monthlyRate' },
      { header: 'Employment Status', key: 'employmentStatus' },
      { header: 'Start Date', key: 'startDate' },
      { header: 'End Date', key: 'endDate' },
      { header: 'Branch', key: 'branch' },
      { header: 'Bank Name', key: 'bankName' },
      { header: 'Bank Account Number', key: 'bankAccountNumber' },
      { header: 'Schedule Code', key: 'scheduleCode' },
      { header: 'Payroll Group Code', key: 'payrollGroupCode' },
      { header: 'TIN Number', key: 'tinNumber' },
      { header: 'SSS Number', key: 'sssNumber' },
      { header: 'HDMF Number', key: 'hdmfNumber' },
      { header: 'PHC Number', key: 'phcNumber' },
    ];

    // Create empty rows for template (e.g., 5000 rows)
    const data = [];
    for (let i = 0; i < 5000; i++) {
      data.push({
        employeeCode: '',
        lastName: '',
        firstName: '',
        middleName: '',
        username: '',
        email: '',
        birthdate: '',
        civilStatus: '',
        sex: '',
        street: '',
        city: '',
        stateProvince: '',
        postalCode: '',
        zipCode: '',
        country: '',
        contactNumber: '',
        role: '',
        reportsTo: '',
        monthlyRate: '',
        employmentStatus: '',
        startDate: '',
        endDate: '',
        branch: '',
        bankName: '',
        bankAccountNumber: '',
        scheduleCode: '',
        payrollGroupCode: '',
        tinNumber: '',
        sssNumber: '',
        hdmfNumber: '',
        phcNumber: '',
      });
    }

    // Prepare dropdown options
    const dropdowns = [
      {
        columnKey: 'civilStatus',
        options: ['Single', 'Married', 'Separated', 'Widowed', 'Divorced'],
      },
      {
        columnKey: 'sex',
        options: ['Male', 'Female'],
      },
      {
        columnKey: 'role',
        options: roles.map((role) => role.name),
      },
      {
        columnKey: 'payrollGroupCode',
        options: payrollGroups.map((pg) => pg.payrollGroupCode),
      },
      {
        columnKey: 'scheduleCode',
        options: schedules.map((schedule) => schedule.scheduleCode),
      },
      {
        columnKey: 'branch',
        options: branches.map((branch) => branch.name),
      },
      {
        columnKey: 'employmentStatus',
        options: employmentStatusReference.map((status) => status.label),
      },
    ];

    // Define date columns
    const dateColumns = ['birthdate', 'startDate', 'endDate'];

    // Generate Excel template file
    return await this.excelExportService.exportToExcel(
      columns,
      data,
      'Employee Import Template',
      dropdowns,
      dateColumns,
    );
  }

  async updateJobDetails(params: EmployeeJobDetailsUpdateDTO) {
    const { accountId, jobDetails, branchId, roleId, parentAccountId } = params;

    // Check if employee exists
    const employee = await this.prisma.employeeData.findUnique({
      where: { accountId },
      include: { account: true },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    // Verify the account belongs to the current company
    if (employee.account.companyId !== this.utilityService.companyId) {
      throw new BadRequestException('Employee not found in this company');
    }

    // Update employee data with job details
    const updatedEmployee = await this.prisma.employeeData.update({
      where: { accountId },
      data: {
        bankName: jobDetails.bankName || null,
        bankAccountNumber: jobDetails.bankAccountNumber || null,
        biometricsNumber: jobDetails.biometricsNumber || null,
        branchId: branchId || employee.branchId,
      },
    });

    // Update account role and parent if provided
    if (roleId !== undefined || parentAccountId !== undefined) {
      await this.prisma.account.update({
        where: { id: accountId },
        data: {
          ...(roleId !== undefined && { roleId: roleId }),
          ...(parentAccountId !== undefined && {
            parentAccountId: parentAccountId || null,
          }),
        },
      });
    }

    return await this.formatResponse(updatedEmployee);
  }

  async updateGovernmentDetails(params: EmployeeGovernmentDetailsUpdateDTO) {
    const { accountId, governmentDetails } = params;

    // Check if employee exists
    const employee = await this.prisma.employeeData.findUnique({
      where: { accountId },
      include: { account: true },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    // Verify the account belongs to the current company
    if (employee.account.companyId !== this.utilityService.companyId) {
      throw new BadRequestException('Employee not found in this company');
    }

    // Update employee data with government details
    const updatedEmployee = await this.prisma.employeeData.update({
      where: { accountId },
      data: {
        tinNumber: governmentDetails.tinNumber || null,
        sssNumber: governmentDetails.sssNumber || null,
        hdmfNumber: governmentDetails.hdmfNumber || null,
        phicNumber: governmentDetails.phicNumber || null,
      },
    });

    return await this.formatResponse(updatedEmployee);
  }

  async updateSchedule(params: EmployeeScheduleUpdateDTO) {
    const { accountId, scheduleId } = params;

    // Check if employee exists
    const employee = await this.prisma.employeeData.findUnique({
      where: { accountId },
      include: { account: true },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    // Verify the account belongs to the current company
    if (employee.account.companyId !== this.utilityService.companyId) {
      throw new BadRequestException('Employee not found in this company');
    }

    // Check if schedule exists
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new BadRequestException('Schedule not found');
    }

    // Verify schedule belongs to the same company
    if (schedule.companyId !== this.utilityService.companyId) {
      throw new BadRequestException('Schedule not found in this company');
    }

    // Update employee schedule
    const updatedEmployee = await this.prisma.employeeData.update({
      where: { accountId },
      data: {
        scheduleId: scheduleId,
      },
    });

    return await this.formatResponse(updatedEmployee);
  }

  async getLeaveSummary(accountId: string) {
    // Check if employee exists
    const employee = await this.prisma.employeeData.findUnique({
      where: { accountId },
      include: { account: true },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    // Get all leave plans assigned to the employee
    const leavePlans = await this.prisma.employeeLeavePlan.findMany({
      where: {
        accountId,
        isActive: true,
      },
      include: {
        leavePlan: {
          include: {
            leaveTypeConfiguration: true,
          },
        },
        leaveCreditHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Calculate summary for each leave type
    const leaveBalances = leavePlans.map((plan) => {
      const currentCredits = Number(plan.currentCredits);
      const usedCredits = Number(plan.usedCredits);
      const carriedCredits = Number(plan.carriedCredits);
      const totalCredits = currentCredits + carriedCredits;

      return {
        id: plan.id,
        leaveType: plan.leavePlan.leaveTypeConfiguration.name,
        planName: plan.leavePlan.planName,
        totalCredits,
        currentBalance: currentCredits,
        usedCredits,
        remainingCredits: currentCredits - usedCredits,
        carriedCredits,
        effectiveDate: plan.effectiveDate,
        isActive: plan.isActive,
      };
    });

    // Calculate summary totals
    const summary = {
      totalTypes: leaveBalances.length,
      totalBalance: leaveBalances.reduce(
        (sum, leave) => sum + leave.currentBalance,
        0,
      ),
      usedThisYear: leaveBalances.reduce(
        (sum, leave) => sum + leave.usedCredits,
        0,
      ),
    };

    return {
      summary,
      leaveBalances,
    };
  }

  async getAllowances(accountId: string) {
    // Check if employee exists
    const employee = await this.prisma.employeeData.findUnique({
      where: { accountId },
      include: { account: true },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    // Get all active allowances for the employee
    const allowances = await this.prisma.allowancePlan.findMany({
      where: {
        accountId,
        isActive: true,
      },
      include: {
        allowanceConfiguration: true,
        AllowancePlanHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format allowances data
    const formattedAllowances = allowances.map((allowance) => ({
      id: allowance.id,
      name: allowance.allowanceConfiguration.name,
      amount: Number(allowance.amount),
      deductionPeriod: allowance.deductionPeriod,
      effectivityDate: allowance.effectivityDate,
      isActive: allowance.isActive,
      lastModified:
        allowance.AllowancePlanHistory[0]?.createdAt || allowance.createdAt,
    }));

    // Calculate total allowances by period
    const totalMonthlyAllowance = formattedAllowances
      .filter((a) => a.deductionPeriod === 'EVERY_PERIOD')
      .reduce((sum, a) => sum + a.amount, 0);

    return {
      allowances: formattedAllowances,
      summary: {
        totalAllowances: formattedAllowances.length,
        totalMonthlyAllowance,
      },
    };
  }

  async getDeductions(accountId: string) {
    // Check if employee exists
    const employee = await this.prisma.employeeData.findUnique({
      where: { accountId },
      include: { account: true },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    // Get all active deductions for the employee
    const deductions = await this.prisma.deductionPlan.findMany({
      where: {
        accountId,
        isActive: true,
      },
      include: {
        deductionConfiguration: true,
        DeductionPlanHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Separate regular deductions and loans
    const regularDeductions = deductions.filter(
      (d) => d.deductionConfiguration.category !== 'LOAN',
    );
    const loans = deductions.filter(
      (d) => d.deductionConfiguration.category === 'LOAN',
    );

    // Format regular deductions
    const formattedRegularDeductions = regularDeductions.map((deduction) => ({
      id: deduction.id,
      name: deduction.deductionConfiguration.name,
      amount: Number(deduction.monthlyAmortization),
      deductionPeriod: deduction.deductionPeriod,
      isActive: deduction.isActive,
    }));

    // Format loans with balance calculation
    const formattedLoans = loans.map((loan) => {
      const totalAmount = Number(loan.totalAmount);
      const totalPaid = Number(loan.totalPaidAmount);
      const balance = Number(loan.remainingBalance);
      const paidPercentage =
        totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

      return {
        id: loan.id,
        name: loan.deductionConfiguration.name,
        totalAmount,
        totalPaid,
        balance,
        paidPercentage,
        monthlyPayment: Number(loan.monthlyAmortization),
        isActive: loan.isActive,
        isOpen: loan.isOpen,
      };
    });

    return {
      regularDeductions: formattedRegularDeductions,
      loans: formattedLoans,
      summary: {
        totalDeductions: formattedRegularDeductions.length,
        totalLoans: formattedLoans.length,
        totalLoanBalance: formattedLoans.reduce(
          (sum, loan) => sum + loan.balance,
          0,
        ),
      },
    };
  }

  async getEmployeeListForScheduling(page = 1, perPage = 20, search?: string) {
    // Calculate pagination
    const skip = (page - 1) * perPage;

    // Build where clause with company filter
    const where: any = {
      account: {
        companyId: this.utilityService.companyId,
        isDeleted: false,
      },
    };

    // Add search functionality
    if (search) {
      where.OR = [
        {
          account: {
            firstName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          account: {
            lastName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          employeeCode: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Get total count for pagination
    const totalCount = await this.prisma.employeeData.count({ where });

    // Get paginated results
    const employees = await this.prisma.employeeData.findMany({
      where,
      skip,
      take: perPage,
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
            teamMembership: {
              select: {
                teamId: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        schedule: {
          select: {
            id: true,
            scheduleCode: true,
            sundayShiftId: true,
            mondayShiftId: true,
            tuesdayShiftId: true,
            wednesdayShiftId: true,
            thursdayShiftId: true,
            fridayShiftId: true,
            saturdayShiftId: true,
          },
        },
      },
      orderBy: {
        account: {
          lastName: 'asc',
        },
      },
    });

    // Format response
    const list = employees.map((emp) => ({
      id: emp.accountId,
      employeeCode: emp.employeeCode,
      name: `${emp.account.firstName} ${emp.account.lastName}`,
      firstName: emp.account.firstName,
      lastName: emp.account.lastName,
      roleId: emp.account.role?.id || null,
      roleName: emp.account.role?.name || 'No Role',
      branchId: emp.branchId,
      branchName: emp.branch?.name || 'No Branch',
      scheduleId: emp.scheduleId,
      scheduleCode: emp.schedule?.scheduleCode || null,
      teamId: emp.account.teamMembership?.teamId || null,
      teamName: emp.account.teamMembership?.team?.name || null,
      weeklyShifts: {
        sunday: emp.schedule?.sundayShiftId || null,
        monday: emp.schedule?.mondayShiftId || null,
        tuesday: emp.schedule?.tuesdayShiftId || null,
        wednesday: emp.schedule?.wednesdayShiftId || null,
        thursday: emp.schedule?.thursdayShiftId || null,
        friday: emp.schedule?.fridayShiftId || null,
        saturday: emp.schedule?.saturdayShiftId || null,
      },
    }));

    return {
      list,
      pagination: {
        currentPage: page,
        perPage,
        totalCount,
        totalPages: Math.ceil(totalCount / perPage),
        hasNextPage: page < Math.ceil(totalCount / perPage),
        hasPrevPage: page > 1,
      },
    };
  }

  async getShiftsForScheduling() {
    const shifts = await this.prisma.shift.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isDeleted: false,
        purpose: ShiftPurpose.REGULAR, // Only regular shifts for scheduling
      },
      include: {
        shiftTime: {
          where: { isBreakTime: false },
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { shiftCode: 'asc' },
    });

    return shifts.map((shift) => {
      const firstShiftTime = shift.shiftTime[0];
      const lastShiftTime = shift.shiftTime[shift.shiftTime.length - 1];

      // Calculate actual work hours
      const workHours = shift.targetHours - shift.breakHours;

      return {
        id: shift.id,
        label: shift.shiftCode,
        value: shift.id,
        shiftCode: shift.shiftCode,
        shiftType: shift.shiftType,
        startTime: firstShiftTime?.startTime || '',
        endTime: lastShiftTime?.endTime || '',
        targetHours: shift.targetHours,
        breakHours: shift.breakHours,
        workHours: workHours,
        // Format work hours for display
        workHoursFormatted: `${workHours}H`,
      };
    });
  }
}
