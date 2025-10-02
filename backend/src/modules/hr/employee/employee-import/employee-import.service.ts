import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { ExcelService } from '@common/services/excel';
import { EmployeeListService } from '../employee-list/employee-list.service';
import { SocketService } from '@modules/communication/socket/socket/socket.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { v4 as uuid } from 'uuid';
import { EmployeeImportTemp, Prisma, EmploymentStatus } from '@prisma/client';
import employmentStatusReference from '../../../../reference/employment-status.reference';
import { MulterFile } from '../../../../types/multer';

interface ValidationMessage {
  field: string;
  message: string;
  type:
    | 'required'
    | 'format'
    | 'unique'
    | 'reference'
    | 'business_rule'
    | 'data_quality';
}

interface RecordValidation {
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  isValid: boolean;
  hasWarnings: boolean;
}

interface ImportSessionResponse {
  batchId: string;
  totalRows: number;
  stage: string;
}

interface ImportStatusResponse {
  batchId: string;
  stage: string;
  totalRows: number;
  validatedRows: number;
  processedRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  errors?: any[];
}

@Injectable()
export class EmployeeImportService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly excelService: ExcelService;
  @Inject() private readonly employeeListService: EmployeeListService;
  @Inject() private readonly socketService: SocketService;
  @Inject() private readonly tableHandlerService: TableHandlerService;

  async uploadAndParseFile(file: MulterFile): Promise<ImportSessionResponse> {
    const batchId = uuid();

    // Create import batch record
    await this.prisma.employeeImportBatch.create({
      data: {
        id: batchId,
        fileName: file.originalname,
        uploadedBy: this.utilityService.accountInformation.id,
        companyId: this.utilityService.companyId,
        status: 'uploading',
      },
    });

    try {
      // Parse Excel file using centralized Excel service
      const parsedData = await this.excelService.importFromBuffer(file.buffer, {
        sheetIndex: 0,
        headerRow: 1,
        dataStartRow: 2,
        trimValues: true,
      });

      const jsonData = parsedData.rows;

      if (jsonData.length === 0) {
        throw new BadRequestException('Excel file is empty');
      }

      // Filter out empty rows but keep track of original row numbers
      const nonEmptyRowsWithIndex = jsonData
        .map((row: any, index: number) => ({ row, originalIndex: index }))
        .filter(({ row }) => {
          // Check if at least one required field has a value
          return (
            row['Employee Code']?.toString().trim() ||
            row['Last Name']?.toString().trim() ||
            row['First Name']?.toString().trim() ||
            row['Username']?.toString().trim() ||
            row['Email Address']?.toString().trim()
          );
        });

      if (nonEmptyRowsWithIndex.length === 0) {
        throw new BadRequestException(
          'No data found in the Excel file. All rows are empty.',
        );
      }

      // Map and save to temp table
      const tempRecords = await Promise.all(
        nonEmptyRowsWithIndex.map(async ({ row, originalIndex }) => {
          const startDate = this.excelService.parseExcelDate(row['Start Date']);
          const endDate = row['End Date']
            ? this.excelService.parseExcelDate(row['End Date'])
            : null;
          const birthdate = row['Birthdate (yyyy/mm/dd)']
            ? this.excelService.parseExcelDate(row['Birthdate (yyyy/mm/dd)'])
            : null;

          // Handle email field - it might be a hyperlink object
          let emailValue = row['Email Address'];
          if (emailValue && typeof emailValue === 'object' && 'text' in emailValue) {
            emailValue = emailValue.text;
          }

          return this.prisma.employeeImportTemp.create({
            data: {
              importBatchId: batchId,
              rowNumber: originalIndex + 2, // Excel rows start at 1, plus header
              employeeCode: String(row['Employee Code'] || '').trim(),
              lastName: String(row['Last Name'] || '').trim(),
              firstName: String(row['First Name'] || '').trim(),
              middleName: row['Middle Name (Optional)']
                ? String(row['Middle Name (Optional)']).trim()
                : null,
              username: String(row['Username'] || '').trim(),
              email: String(emailValue || '').trim(),
              birthdate: birthdate,
              civilStatus: String(row['Civil Status'] || '').trim(),
              sex: String(row['Sex'] || '').trim(),
              street: String(row['Street'] || '').trim(),
              city: String(row['City / Town'] || '').trim(),
              stateProvince: String(row['State / Province'] || '').trim(),
              postalCode: String(row['Postal Code'] || '').trim(),
              zipCode: String(row['ZIP Code'] || '').trim(),
              country: String(row['Country'] || '').trim(),
              contactNumber: String(row['Contact Number'] || '').trim(),
              role: String(row['Role/Position'] || '').trim(),
              reportsTo: row['Reports To (Employee Code)']
                ? String(row['Reports To (Employee Code)']).trim()
                : null,
              monthlyRate: parseFloat(row['Monthly Rate']) || 0,
              employmentStatus: String(row['Employment Status'] || '').trim(),
              startDate: startDate,
              endDate: endDate,
              branch: String(row['Branch'] || '').trim(),
              bankName: String(row['Bank Name'] || '').trim(),
              bankAccountNumber: String(
                row['Bank Account Number'] || '',
              ).trim(),
              scheduleCode: String(row['Schedule Code'] || '').trim(),
              payrollGroupCode: String(row['Payroll Group Code'] || '').trim(),
              tinNumber: String(row['TIN Number'] || '').trim(),
              sssNumber: String(row['SSS Number'] || '').trim(),
              hdmfNumber: String(row['HDMF Number'] || '').trim(),
              phcNumber: String(row['PHC Number'] || '').trim(),
              status: 'pending',
            },
          });
        }),
      );

      // Update batch with total rows
      await this.prisma.employeeImportBatch.update({
        where: { id: batchId },
        data: {
          totalRows: tempRecords.length,
          status: 'uploaded',
        },
      });

      // Log processing info
      console.log(
        `Import ${batchId}: Processed ${tempRecords.length} non-empty rows out of ${jsonData.length} total rows in Excel`,
      );

      // Emit progress update
      this.emitProgress(batchId, {
        stage: 'uploaded',
        totalRows: tempRecords.length,
        current: tempRecords.length,
        percentage: 100,
      });

      return {
        batchId,
        totalRows: tempRecords.length,
        stage: 'uploaded',
      };
    } catch (error) {
      // Update batch status to failed
      await this.prisma.employeeImportBatch.update({
        where: { id: batchId },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  async validateBatch(batchId: string): Promise<void> {
    const batch = await this.prisma.employeeImportBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new BadRequestException('Import batch not found');
    }

    // Update status to validating
    await this.prisma.employeeImportBatch.update({
      where: { id: batchId },
      data: { status: 'validating' },
    });

    const tempRecords = await this.prisma.employeeImportTemp.findMany({
      where: { importBatchId: batchId },
      orderBy: { rowNumber: 'asc' },
    });

    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    // Validate each record
    for (let i = 0; i < tempRecords.length; i++) {
      const record = tempRecords[i];
      const validation = await this.validateRecord(record, tempRecords);

      const hasErrors = validation.errors.length > 0;
      const hasWarnings = validation.warnings.length > 0;

      // Clear reportsTo if needed
      const updateData: any = {
        isValid: !hasErrors,
        hasWarnings: hasWarnings,
        validationErrors: hasErrors
          ? (validation.errors as any)
          : Prisma.JsonNull,
        validationWarnings: hasWarnings
          ? (validation.warnings as any)
          : Prisma.JsonNull,
        status: hasErrors
          ? 'failed'
          : hasWarnings
            ? 'awaiting_approval'
            : 'validated',
        isUpdate: validation.isUpdate || false,
        existingAccountId: validation.existingAccountId || null,
      };

      // If Level 0 role, clear the reportsTo field
      if (validation.clearReportsTo) {
        updateData.reportsTo = null;
      }

      await this.prisma.employeeImportTemp.update({
        where: { id: record.id },
        data: updateData,
      });

      if (hasErrors) {
        errorCount++;
      } else if (hasWarnings) {
        warningCount++;
      } else {
        validCount++;
      }

      // Emit progress
      this.emitProgress(batchId, {
        stage: 'validating',
        current: i + 1,
        total: tempRecords.length,
        percentage: Math.round(((i + 1) / tempRecords.length) * 100),
        stats: {
          validRows: validCount,
          warningRows: warningCount,
          errorRows: errorCount,
        },
      });
    }

    // Update batch with validation results
    await this.prisma.employeeImportBatch.update({
      where: { id: batchId },
      data: {
        validRows: validCount + warningCount,
        failedRows: errorCount,
        status: 'validated',
      },
    });

    this.emitProgress(batchId, {
      stage: 'validated',
      stats: {
        validRows: validCount,
        warningRows: warningCount,
        errorRows: errorCount,
      },
    });
  }

  async validateRecord(
    record: EmployeeImportTemp,
    allRecords: EmployeeImportTemp[],
  ): Promise<
    RecordValidation & {
      isUpdate?: boolean;
      existingAccountId?: string;
      clearReportsTo?: boolean;
    }
  > {
    const errors: ValidationMessage[] = [];
    const warnings: ValidationMessage[] = [];
    let clearReportsTo = false;

    // 1. Field-Level Validations
    // Required fields
    if (!record.employeeCode?.trim()) {
      errors.push({
        field: 'employeeCode',
        message: 'Employee Code is required',
        type: 'required',
      });
    }
    if (!record.lastName?.trim()) {
      errors.push({
        field: 'lastName',
        message: 'Last Name is required',
        type: 'required',
      });
    }
    if (!record.firstName?.trim()) {
      errors.push({
        field: 'firstName',
        message: 'First Name is required',
        type: 'required',
      });
    }
    if (!record.username?.trim()) {
      errors.push({
        field: 'username',
        message: 'Username is required',
        type: 'required',
      });
    }
    if (!record.email?.trim()) {
      errors.push({
        field: 'email',
        message: 'Email Address is required',
        type: 'required',
      });
    }
    if (!record.contactNumber?.trim()) {
      errors.push({
        field: 'contactNumber',
        message: 'Contact Number is required',
        type: 'required',
      });
    }
    if (!record.role?.trim()) {
      errors.push({
        field: 'role',
        message: 'Role/Position is required',
        type: 'required',
      });
    }
    if (record.monthlyRate <= 0) {
      errors.push({
        field: 'monthlyRate',
        message: 'Monthly Rate must be greater than 0',
        type: 'required',
      });
    }
    if (!record.employmentStatus?.trim()) {
      errors.push({
        field: 'employmentStatus',
        message: 'Employment Status is required',
        type: 'required',
      });
    }
    if (!record.branch?.trim()) {
      errors.push({
        field: 'branch',
        message: 'Branch is required',
        type: 'required',
      });
    }
    if (!record.scheduleCode?.trim()) {
      errors.push({
        field: 'scheduleCode',
        message: 'Schedule Code is required',
        type: 'required',
      });
    }
    if (!record.payrollGroupCode?.trim()) {
      errors.push({
        field: 'payrollGroupCode',
        message: 'Payroll Group Code is required',
        type: 'required',
      });
    }

    // Format validations
    if (record.email && !this.isValidEmail(record.email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
        type: 'format',
      });
    }

    // Length validations
    if (record.username && record.username.length < 3) {
      errors.push({
        field: 'username',
        message: 'Username must be at least 3 characters',
        type: 'format',
      });
    }
    if (record.employeeCode && record.employeeCode.length > 50) {
      errors.push({
        field: 'employeeCode',
        message: 'Employee Code must not exceed 50 characters',
        type: 'format',
      });
    }

    // New field validations
    // Civil Status validation
    if (record.civilStatus) {
      const validCivilStatuses = [
        'Single',
        'Married',
        'Separated',
        'Widowed',
        'Divorced',
      ];
      if (!validCivilStatuses.includes(record.civilStatus)) {
        errors.push({
          field: 'civilStatus',
          message: `Invalid civil status. Must be one of: ${validCivilStatuses.join(', ')}`,
          type: 'format',
        });
      }
    }

    // Sex validation
    if (record.sex) {
      const validSexValues = ['Male', 'Female'];
      if (!validSexValues.includes(record.sex)) {
        errors.push({
          field: 'sex',
          message: 'Invalid sex. Must be either Male or Female',
          type: 'format',
        });
      }
    }

    // Government ID format validations
    if (record.tinNumber && !this.isValidTIN(record.tinNumber)) {
      warnings.push({
        field: 'tinNumber',
        message: 'TIN number format may be incorrect',
        type: 'format',
      });
    }
    if (record.sssNumber && !this.isValidSSS(record.sssNumber)) {
      warnings.push({
        field: 'sssNumber',
        message: 'SSS number format may be incorrect',
        type: 'format',
      });
    }
    if (record.hdmfNumber && !this.isValidHDMF(record.hdmfNumber)) {
      warnings.push({
        field: 'hdmfNumber',
        message: 'HDMF/Pag-IBIG number format may be incorrect',
        type: 'format',
      });
    }
    if (record.phcNumber && !this.isValidPhilHealth(record.phcNumber)) {
      warnings.push({
        field: 'phcNumber',
        message: 'PhilHealth number format may be incorrect',
        type: 'format',
      });
    }

    // 2. Business Rule Validations
    // Employee Code uniqueness in batch
    const duplicateInBatch = allRecords.find(
      (r) =>
        r.id !== record.id &&
        r.employeeCode?.toLowerCase() === record.employeeCode?.toLowerCase(),
    );
    if (duplicateInBatch) {
      errors.push({
        field: 'employeeCode',
        message: `Duplicate employee code in row ${duplicateInBatch.rowNumber}`,
        type: 'unique',
      });
    }

    // Check for existing employee - could be an update scenario
    let isUpdate = false;
    let existingAccountId: string | null = null;

    // First, check if employee code exists
    const existingEmployee = record.employeeCode
      ? await this.prisma.employeeData.findFirst({
          where: {
            employeeCode: record.employeeCode,
            account: { companyId: this.utilityService.companyId },
          },
          include: { account: true },
        })
      : null;

    // Check if username exists
    const existingUserByUsername = record.username
      ? await this.prisma.account.findFirst({
          where: {
            username: record.username.toLowerCase(),
            companyId: this.utilityService.companyId,
          },
        })
      : null;

    // Check if email exists
    const existingUserByEmail = record.email
      ? await this.prisma.account.findFirst({
          where: {
            email: record.email.toLowerCase(),
            companyId: this.utilityService.companyId,
          },
        })
      : null;

    // Determine if this is an update scenario (employee code AND username match same account)
    if (existingEmployee && existingUserByUsername) {
      // Check if both point to the same account
      if (existingEmployee.accountId === existingUserByUsername.id) {
        // This is an update scenario
        isUpdate = true;
        existingAccountId = existingEmployee.accountId;
        warnings.push({
          field: 'employeeCode',
          message: `This will update existing employee: ${existingEmployee.account.firstName} ${existingEmployee.account.lastName}`,
          type: 'business_rule',
        });

        // If email is being changed, add a warning
        if (
          existingUserByEmail &&
          existingUserByEmail.id !== existingEmployee.accountId
        ) {
          warnings.push({
            field: 'email',
            message: `Email address already exists for another user. Email will NOT be updated.`,
            type: 'business_rule',
          });
        }
      } else {
        // Different accounts - this is an error
        errors.push({
          field: 'employeeCode',
          message: 'Employee code and username belong to different employees',
          type: 'unique',
        });
      }
    } else {
      // Check individual uniqueness if not an update
      if (existingEmployee) {
        errors.push({
          field: 'employeeCode',
          message: 'Employee code already exists in the system',
          type: 'unique',
        });
      }

      if (existingUserByUsername) {
        errors.push({
          field: 'username',
          message: 'Username already exists in the system',
          type: 'unique',
        });
      }

      if (existingUserByEmail) {
        errors.push({
          field: 'email',
          message: 'Email address already exists in the system',
          type: 'unique',
        });
      }
    }

    // Employment Status validations
    const validStatuses = employmentStatusReference.map((s) => s.label);
    if (
      record.employmentStatus &&
      !validStatuses.includes(record.employmentStatus)
    ) {
      errors.push({
        field: 'employmentStatus',
        message: `Invalid employment status. Must be one of: ${validStatuses.join(', ')}`,
        type: 'reference',
      });
    }

    if (record.employmentStatus === 'Regular' && record.endDate) {
      warnings.push({
        field: 'endDate',
        message: "Regular employees typically don't have end dates",
        type: 'business_rule',
      });
    }

    if (record.employmentStatus !== 'Regular' && !record.endDate) {
      warnings.push({
        field: 'endDate',
        message: `${record.employmentStatus} employees should have an end date`,
        type: 'business_rule',
      });
    }

    // Date validations
    if (record.birthdate) {
      const birthdate = new Date(record.birthdate);
      if (isNaN(birthdate.getTime())) {
        errors.push({
          field: 'birthdate',
          message: 'Invalid birthdate format',
          type: 'format',
        });
      } else {
        const currentDate = new Date();
        const age = Math.floor(
          (currentDate.getTime() - birthdate.getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        );
        if (age < 18) {
          errors.push({
            field: 'birthdate',
            message: 'Employee must be at least 18 years old',
            type: 'business_rule',
          });
        }
        if (age > 65) {
          warnings.push({
            field: 'birthdate',
            message: 'Employee is above retirement age',
            type: 'data_quality',
          });
        }
      }
    }

    if (record.startDate) {
      const startDate = new Date(record.startDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      if (startDate > thirtyDaysFromNow) {
        warnings.push({
          field: 'startDate',
          message: 'Start date is more than 30 days in the future',
          type: 'business_rule',
        });
      }
    }

    if (record.endDate && record.startDate) {
      if (new Date(record.endDate) <= new Date(record.startDate)) {
        errors.push({
          field: 'endDate',
          message: 'End date must be after start date',
          type: 'business_rule',
        });
      }
    }

    // 3. Reference Data Validations
    // Role validation
    let roleLevel: number | null = null;
    if (record.role) {
      const role = await this.prisma.role.findFirst({
        where: {
          name: { equals: record.role, mode: 'insensitive' },
          companyId: this.utilityService.companyId,
          isDeleted: false,
        },
      });
      if (!role) {
        errors.push({
          field: 'role',
          message: `Role '${record.role}' not found`,
          type: 'reference',
        });
      } else {
        roleLevel = role.level;
      }
    }

    // Branch validation
    if (record.branch) {
      const branch = await this.prisma.project.findFirst({
        where: {
          name: { equals: record.branch, mode: 'insensitive' },
          companyId: this.utilityService.companyId,
          status: 'BRANCH',
          isDeleted: false,
        },
      });
      if (!branch) {
        errors.push({
          field: 'branch',
          message: `Branch '${record.branch}' not found`,
          type: 'reference',
        });
      }
    }

    // Schedule validation
    if (record.scheduleCode) {
      const schedule = await this.prisma.schedule.findFirst({
        where: {
          scheduleCode: record.scheduleCode,
          companyId: this.utilityService.companyId,
          isDeleted: false,
        },
      });
      if (!schedule) {
        errors.push({
          field: 'scheduleCode',
          message: `Schedule code '${record.scheduleCode}' not found`,
          type: 'reference',
        });
      }
    }

    // Payroll Group validation
    if (record.payrollGroupCode) {
      const payrollGroup = await this.prisma.payrollGroup.findFirst({
        where: {
          payrollGroupCode: record.payrollGroupCode,
          company: { id: this.utilityService.companyId },
          isDeleted: false,
        },
      });
      if (!payrollGroup) {
        errors.push({
          field: 'payrollGroupCode',
          message: `Payroll group code '${record.payrollGroupCode}' not found`,
          type: 'reference',
        });
      }
    }

    // 4. Hierarchical Validations
    // Check if Level 0 role has a parent and mark for clearing
    if (roleLevel !== null && roleLevel === 0 && record.reportsTo) {
      warnings.push({
        field: 'reportsTo',
        message:
          'Level 0 roles cannot have a parent user. Reports To field will be cleared.',
        type: 'business_rule',
      });
      // Mark that we need to clear the reportsTo field
      clearReportsTo = true;
    }

    if (record.reportsTo && !clearReportsTo) {
      if (record.reportsTo === record.employeeCode) {
        errors.push({
          field: 'reportsTo',
          message: 'Employee cannot report to themselves',
          type: 'business_rule',
        });
      }

      // Check if manager exists (in batch or existing)
      const managerInBatch = allRecords.find(
        (r) => r.employeeCode === record.reportsTo,
      );
      const managerExists = await this.prisma.employeeData.findFirst({
        where: {
          employeeCode: record.reportsTo,
          account: { companyId: this.utilityService.companyId },
        },
      });

      if (!managerInBatch && !managerExists) {
        errors.push({
          field: 'reportsTo',
          message: `Manager with employee code '${record.reportsTo}' not found`,
          type: 'reference',
        });
      }

      // Check for circular references
      if (await this.hasCircularReference(record, allRecords)) {
        errors.push({
          field: 'reportsTo',
          message: 'Circular reporting relationship detected',
          type: 'business_rule',
        });
      }
    }

    // 5. Data Quality Validations
    // Name quality checks
    if (record.firstName === record.firstName.toUpperCase()) {
      warnings.push({
        field: 'firstName',
        message: 'First name is all uppercase',
        type: 'data_quality',
      });
    }
    if (record.lastName === record.lastName.toUpperCase()) {
      warnings.push({
        field: 'lastName',
        message: 'Last name is all uppercase',
        type: 'data_quality',
      });
    }

    // Check for potential duplicates
    const similarEmployee = await this.findSimilarEmployee(record);
    if (similarEmployee) {
      warnings.push({
        field: 'employeeCode',
        message: `Similar employee found: ${similarEmployee.firstName} ${similarEmployee.lastName} (${similarEmployee.employeeCode})`,
        type: 'data_quality',
      });
    }

    // 6. Additional Contact Information Warnings
    // Check for duplicate phone numbers
    if (record.contactNumber) {
      const duplicatePhone = await this.prisma.account.findFirst({
        where: {
          contactNumber: record.contactNumber,
          companyId: this.utilityService.companyId,
          NOT: { email: record.email }, // Exclude if it's the same person
        },
        include: { EmployeeData: true },
      });

      if (duplicatePhone) {
        warnings.push({
          field: 'contactNumber',
          message: `Contact number already used by ${duplicatePhone.firstName} ${duplicatePhone.lastName}`,
          type: 'data_quality',
        });
      }

      // Check phone format (Philippine format)
      const phoneRegex = /^(09|\+639)\d{9}$/;
      if (!phoneRegex.test(record.contactNumber.replace(/[-\s]/g, ''))) {
        warnings.push({
          field: 'contactNumber',
          message: 'Contact number format appears unusual',
          type: 'data_quality',
        });
      }
    }

    // 7. Salary/Compensation Warnings
    if (record.monthlyRate) {
      // Unusually high salary
      if (record.monthlyRate > 500000) {
        warnings.push({
          field: 'monthlyRate',
          message: `Monthly rate is unusually high (₱${record.monthlyRate.toLocaleString()})`,
          type: 'business_rule',
        });
      }

      // Below minimum wage (NCR minimum as of 2024)
      if (record.monthlyRate < 18000) {
        warnings.push({
          field: 'monthlyRate',
          message: 'Monthly rate may be below minimum wage',
          type: 'business_rule',
        });
      }
    }

    // 8. Hierarchical Warnings
    if (record.reportsTo) {
      // Check for cross-branch reporting
      const managerData = await this.prisma.employeeData.findFirst({
        where: {
          employeeCode: record.reportsTo,
          account: { companyId: this.utilityService.companyId },
        },
        include: {
          branch: true,
        },
      });

      if (managerData && managerData.branch && record.branch) {
        const employeeBranch = await this.prisma.project.findFirst({
          where: {
            name: { equals: record.branch, mode: 'insensitive' },
            companyId: this.utilityService.companyId,
            status: 'BRANCH',
          },
        });

        if (employeeBranch && managerData.branch.id !== employeeBranch.id) {
          warnings.push({
            field: 'reportsTo',
            message: `Employee in ${record.branch} reports to manager in ${managerData.branch.name}`,
            type: 'business_rule',
          });
        }
      }

      // Check for too many direct reports
      const directReportsCount = allRecords.filter(
        (r) => r.reportsTo === record.reportsTo,
      ).length;
      if (directReportsCount > 15) {
        warnings.push({
          field: 'reportsTo',
          message: `Manager ${record.reportsTo} will have ${directReportsCount} direct reports`,
          type: 'business_rule',
        });
      }
    }

    // 9. Additional Date Warnings
    if (record.startDate) {
      const startDate = new Date(record.startDate);
      const dayOfWeek = startDate.getDay();

      // Weekend check
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        warnings.push({
          field: 'startDate',
          message: `Start date falls on a ${dayOfWeek === 0 ? 'Sunday' : 'Saturday'}`,
          type: 'business_rule',
        });
      }

      // Retroactive start date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDateOnly = new Date(startDate);
      startDateOnly.setHours(0, 0, 0, 0);

      if (startDateOnly < today) {
        const daysDiff = Math.floor(
          (today.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24),
        );
        warnings.push({
          field: 'startDate',
          message: `Start date is ${daysDiff} days in the past`,
          type: 'business_rule',
        });
      }
    }

    // Contract end date warnings
    if (record.endDate && record.employmentStatus !== 'Regular') {
      const endDate = new Date(record.endDate);
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);

      if (endDate > twoYearsFromNow) {
        warnings.push({
          field: 'endDate',
          message: 'Contract end date is more than 2 years in the future',
          type: 'business_rule',
        });
      }
    }

    // 10. Name Quality Warnings
    // Single character names
    if (record.firstName && record.firstName.length === 1) {
      warnings.push({
        field: 'firstName',
        message: 'First name is only one character',
        type: 'data_quality',
      });
    }
    if (record.lastName && record.lastName.length === 1) {
      warnings.push({
        field: 'lastName',
        message: 'Last name is only one character',
        type: 'data_quality',
      });
    }

    // Names with numbers or special characters
    const nameRegex = /^[a-zA-Z\s\-'ñÑ]+$/;
    if (record.firstName && !nameRegex.test(record.firstName)) {
      warnings.push({
        field: 'firstName',
        message: 'First name contains numbers or special characters',
        type: 'data_quality',
      });
    }
    if (record.lastName && !nameRegex.test(record.lastName)) {
      warnings.push({
        field: 'lastName',
        message: 'Last name contains numbers or special characters',
        type: 'data_quality',
      });
    }

    // Very long names
    if (record.firstName && record.firstName.length > 30) {
      warnings.push({
        field: 'firstName',
        message: 'First name is unusually long',
        type: 'data_quality',
      });
    }
    if (record.lastName && record.lastName.length > 30) {
      warnings.push({
        field: 'lastName',
        message: 'Last name is unusually long',
        type: 'data_quality',
      });
    }

    // 11. Username/Email Warnings
    // Check username format
    if (record.username && record.firstName && record.lastName) {
      const expectedUsername = `${record.firstName.toLowerCase()}.${record.lastName.toLowerCase()}`;
      if (
        !record.username
          .toLowerCase()
          .startsWith(expectedUsername.substring(0, 10))
      ) {
        warnings.push({
          field: 'username',
          message:
            "Username doesn't follow standard format (firstname.lastname)",
          type: 'data_quality',
        });
      }
    }

    // Personal email domain
    if (record.email) {
      const personalDomains = [
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'icloud.com',
      ];
      const emailDomain = record.email.split('@')[1]?.toLowerCase();
      if (emailDomain && personalDomains.includes(emailDomain)) {
        warnings.push({
          field: 'email',
          message: 'Email uses personal domain instead of company domain',
          type: 'data_quality',
        });
      }
    }

    // 12. Business Logic Warnings
    // Probationary period check
    if (
      record.employmentStatus === 'Probationary' &&
      record.startDate &&
      record.endDate
    ) {
      const startDate = new Date(record.startDate);
      const endDate = new Date(record.endDate);
      const monthsDiff =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());

      if (monthsDiff !== 6) {
        warnings.push({
          field: 'endDate',
          message: `Probationary period is ${monthsDiff > 6 ? 'longer' : 'shorter'} than standard 6 months`,
          type: 'business_rule',
        });
      }
    }

    // Missing middle name (optional warning)
    if (!record.middleName) {
      warnings.push({
        field: 'middleName',
        message: 'No middle name provided (optional field)',
        type: 'data_quality',
      });
    }

    return {
      errors,
      warnings,
      isValid: errors.length === 0,
      hasWarnings: warnings.length > 0,
      isUpdate,
      existingAccountId,
      clearReportsTo,
    };
  }

  async approveWarnings(batchId: string, approvedIds: number[]): Promise<void> {
    await this.prisma.employeeImportTemp.updateMany({
      where: {
        importBatchId: batchId,
        id: { in: approvedIds },
        hasWarnings: true,
        isValid: true,
      },
      data: {
        isApproved: true,
        approvedBy: this.utilityService.accountInformation.id,
        approvedAt: new Date(),
        status: 'approved',
      },
    });
  }

  async processBatch(batchId: string): Promise<void> {
    const batch = await this.prisma.employeeImportBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new BadRequestException('Import batch not found');
    }

    // Update status to processing
    await this.prisma.employeeImportBatch.update({
      where: { id: batchId },
      data: { status: 'processing' },
    });

    // Get records to process (valid or approved)
    const recordsToProcess = await this.prisma.employeeImportTemp.findMany({
      where: {
        importBatchId: batchId,
        OR: [
          { isValid: true, hasWarnings: false },
          { isValid: true, hasWarnings: true, isApproved: true },
        ],
      },
      orderBy: { rowNumber: 'asc' },
    });

    let processedCount = 0;
    let failedCount = 0;

    // Process each record
    for (let i = 0; i < recordsToProcess.length; i++) {
      const record = recordsToProcess[i];

      try {
        await this.createOrUpdateEmployee(record);

        await this.prisma.employeeImportTemp.update({
          where: { id: record.id },
          data: { status: 'processed' },
        });

        processedCount++;
      } catch (error) {
        await this.prisma.employeeImportTemp.update({
          where: { id: record.id },
          data: {
            status: 'failed',
            validationErrors: [
              {
                field: 'general',
                message: error.message,
                type: 'business_rule',
              },
            ],
          },
        });

        failedCount++;
      }

      // Emit progress
      this.emitProgress(batchId, {
        stage: 'processing',
        current: i + 1,
        total: recordsToProcess.length,
        percentage: Math.round(((i + 1) / recordsToProcess.length) * 100),
        stats: {
          processedRows: processedCount,
          failedRows: failedCount,
        },
      });
    }

    // Update batch as completed
    await this.prisma.employeeImportBatch.update({
      where: { id: batchId },
      data: {
        status: 'completed',
        processedRows: processedCount,
        failedRows: batch.failedRows + failedCount,
        completedAt: new Date(),
      },
    });

    this.emitProgress(batchId, {
      stage: 'complete',
      stats: {
        processedRows: processedCount,
        failedRows: failedCount,
      },
    });
  }

  async createOrUpdateEmployee(record: EmployeeImportTemp): Promise<void> {
    // Get reference data
    const role = await this.prisma.role.findFirst({
      where: {
        name: { equals: record.role, mode: 'insensitive' },
        companyId: this.utilityService.companyId,
      },
    });

    const branch = await this.prisma.project.findFirst({
      where: {
        name: { equals: record.branch, mode: 'insensitive' },
        companyId: this.utilityService.companyId,
        status: 'BRANCH',
      },
    });

    const schedule = await this.prisma.schedule.findFirst({
      where: {
        scheduleCode: record.scheduleCode,
        companyId: this.utilityService.companyId,
      },
    });

    const payrollGroup = await this.prisma.payrollGroup.findFirst({
      where: {
        payrollGroupCode: record.payrollGroupCode,
        company: { id: this.utilityService.companyId },
      },
    });

    // Find parent account if reportsTo is specified
    let parentAccountId = null;
    if (record.reportsTo) {
      const parentEmployee = await this.prisma.employeeData.findFirst({
        where: {
          employeeCode: record.reportsTo,
          account: { companyId: this.utilityService.companyId },
        },
      });
      if (parentEmployee) {
        parentAccountId = parentEmployee.accountId;
      }
    }

    // Map employment status
    const employmentStatusEnum = employmentStatusReference.find(
      (s) => s.label === record.employmentStatus,
    )?.key as EmploymentStatus;

    // Check if this is an update
    if (record.isUpdate && record.existingAccountId) {
      // Get existing employee data
      const existingEmployee = await this.prisma.employeeData.findFirst({
        where: {
          accountId: record.existingAccountId,
        },
        include: {
          account: true,
        },
      });

      if (!existingEmployee) {
        throw new Error('Existing employee data not found for update');
      }

      // Check if email is being changed and if new email already exists
      let emailToUse = record.email;
      if (
        existingEmployee.account.email.toLowerCase() !==
        record.email.toLowerCase()
      ) {
        const emailExists = await this.prisma.account.findFirst({
          where: {
            email: record.email.toLowerCase(),
            NOT: { id: record.existingAccountId },
          },
        });

        if (emailExists) {
          // Keep existing email if new one is taken
          emailToUse = existingEmployee.account.email;
        }
      }

      // Update employee using employee list service
      await this.employeeListService.edit({
        accountId: record.existingAccountId,
        employeeCode: record.employeeCode,
        payrollGroupId: payrollGroup.id,
        scheduleId: schedule.id,
        branchId: branch.id,
        bankName: record.bankName || null,
        bankAccountNumber: record.bankAccountNumber || null,
        tinNumber: record.tinNumber || null,
        sssNumber: record.sssNumber || null,
        hdmfNumber: record.hdmfNumber || null,
        phicNumber: record.phcNumber || null,
        accountDetails: {
          firstName: record.firstName,
          lastName: record.lastName,
          middleName: record.middleName || '',
          email: emailToUse,
          username: record.username,
          contactNumber: record.contactNumber,
          roleID: role.id,
          parentAccountId: parentAccountId,
          password: '', // Not used for updates, but required by interface
          dateOfBirth: record.birthdate || null,
          gender: record.sex || null,
          civilStatus: record.civilStatus || null,
          street: record.street || null,
          city: record.city || null,
          stateProvince: record.stateProvince || null,
          postalCode: record.postalCode || null,
          zipCode: record.zipCode || null,
          country: record.country || null,
        } as any,
        contractDetails: {
          monthlyRate: record.monthlyRate,
          startDate: record.startDate.toISOString(),
          endDate: record.endDate ? record.endDate.toISOString() : null,
          employmentStatus: employmentStatusEnum,
          contractFileId: null,
        },
      });
    } else {
      // Generate password based on birthdate
      let password = 'TempPass123!'; // Default fallback
      if (record.birthdate) {
        const birthDate = new Date(record.birthdate);
        const month = String(birthDate.getMonth() + 1).padStart(2, '0');
        const day = String(birthDate.getDate()).padStart(2, '0');
        const year = birthDate.getFullYear();
        password = `${month}${day}${year}`; // MMDDYYYY format
      } else {
        // Log when using fallback password
        console.log(
          `Employee ${record.employeeCode} has no birthdate, using fallback password`,
        );
      }

      // Create new employee
      await this.employeeListService.add({
        employeeCode: record.employeeCode,
        payrollGroupId: payrollGroup.id,
        scheduleId: schedule.id,
        branchId: branch.id,
        bankName: record.bankName || null,
        bankAccountNumber: record.bankAccountNumber || null,
        tinNumber: record.tinNumber || null,
        sssNumber: record.sssNumber || null,
        hdmfNumber: record.hdmfNumber || null,
        phicNumber: record.phcNumber || null,
        accountDetails: {
          firstName: record.firstName,
          lastName: record.lastName,
          middleName: record.middleName || '',
          email: record.email,
          username: record.username,
          password: password,
          contactNumber: record.contactNumber,
          roleID: role.id,
          parentAccountId: parentAccountId,
          dateOfBirth: record.birthdate || null,
          gender: record.sex || null,
          civilStatus: record.civilStatus || null,
          street: record.street || null,
          city: record.city || null,
          stateProvince: record.stateProvince || null,
          postalCode: record.postalCode || null,
          zipCode: record.zipCode || null,
          country: record.country || null,
        },
        contractDetails: {
          monthlyRate: record.monthlyRate,
          startDate: record.startDate.toISOString(),
          endDate: record.endDate ? record.endDate.toISOString() : null,
          employmentStatus: employmentStatusEnum,
          contractFileId: null,
        },
      });
    }
  }

  async getImportStatus(batchId: string): Promise<ImportStatusResponse> {
    const batch = await this.prisma.employeeImportBatch.findUnique({
      where: { id: batchId },
      include: {
        tempRecords: {
          where: {
            OR: [{ isValid: false }, { hasWarnings: true }],
          },
        },
      },
    });

    if (!batch) {
      throw new BadRequestException('Import batch not found');
    }

    const stats = await this.prisma.employeeImportTemp.groupBy({
      by: ['status'],
      where: { importBatchId: batchId },
      _count: true,
    });

    const validRows = stats.find((s) => s.status === 'validated')?._count || 0;
    const warningRows =
      stats.find((s) => s.status === 'awaiting_approval')?._count || 0;
    const errorRows = stats.find((s) => s.status === 'failed')?._count || 0;
    const processedRows =
      stats.find((s) => s.status === 'processed')?._count || 0;

    return {
      batchId,
      stage: batch.status,
      totalRows: batch.totalRows,
      validatedRows: validRows + warningRows + errorRows,
      processedRows,
      validRows,
      warningRows,
      errorRows,
      errors: batch.tempRecords.map((r) => ({
        id: r.id,
        rowNumber: r.rowNumber,
        employeeCode: r.employeeCode,
        firstName: r.firstName,
        lastName: r.lastName,
        validationErrors: r.validationErrors,
        validationWarnings: r.validationWarnings,
      })),
    };
  }

  async getImportHistory(query: TableQueryDTO, body: TableBodyDTO) {
    // Create a new body object with proper defaults
    const processedBody = {
      filters: body.filters || [],
      settings: {
        defaultOrderBy: 'startedAt',
        defaultOrderType: 'desc',
        sort: [],
        filter: [],
        ...body.settings,
      },
      searchKeyword: body.searchKeyword,
      searchBy: body.searchBy,
    };

    this.tableHandlerService.initialize(
      query,
      processedBody,
      'employeeImportBatch',
    );
    const tableQuery = this.tableHandlerService.constructTableQuery();

    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utilityService.companyId,
    };

    tableQuery['include'] = {
      account: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    };

    const { list, currentPage, pagination } =
      await this.tableHandlerService.getTableData(
        this.prisma.employeeImportBatch,
        query,
        tableQuery,
      );

    return { list, pagination, currentPage };
  }

  async getImportBatchDetails(batchId: string) {
    return this.prisma.employeeImportBatch.findUnique({
      where: { id: batchId },
      include: {
        account: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async getImportBatchErrors(batchId: string) {
    return this.prisma.employeeImportTemp.findMany({
      where: {
        importBatchId: batchId,
        OR: [{ isValid: false }, { status: 'failed' }],
      },
      orderBy: { rowNumber: 'asc' },
    });
  }

  async generateErrorReport(batchId: string): Promise<Buffer> {
    const errors = await this.prisma.employeeImportTemp.findMany({
      where: {
        importBatchId: batchId,
        OR: [{ isValid: false }, { hasWarnings: true, isApproved: false }],
      },
      orderBy: { rowNumber: 'asc' },
    });

    const columns = [
      { header: 'Row Number', key: 'rowNumber' },
      { header: 'Employee Code', key: 'employeeCode' },
      { header: 'Name', key: 'fullName' },
      { header: 'Type', key: 'type' },
      { header: 'Issues', key: 'issues' },
    ];

    const data = errors.map((error) => {
      const allIssues = [];

      if (error.validationErrors && Array.isArray(error.validationErrors)) {
        allIssues.push(
          ...(error.validationErrors as any[]).map(
            (e) => `ERROR: ${e.field} - ${e.message}`,
          ),
        );
      }

      if (error.validationWarnings && Array.isArray(error.validationWarnings)) {
        allIssues.push(
          ...(error.validationWarnings as any[]).map(
            (w) => `WARNING: ${w.field} - ${w.message}`,
          ),
        );
      }

      return {
        rowNumber: error.rowNumber,
        employeeCode: error.employeeCode,
        fullName: `${error.firstName} ${error.lastName}`,
        type: error.isValid === false ? 'Error' : 'Warning',
        issues: allIssues.join('; '),
      };
    });

    return await this.excelService.exportToBuffer(
      columns,
      data,
      'Import Errors',
    );
  }

  // Helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidTIN(tin: string): boolean {
    // Philippine TIN format: XXX-XXX-XXX-XXX or XXXXXXXXXXXX (12 digits)
    const tinRegex = /^(\d{3}-\d{3}-\d{3}-\d{3}|\d{12})$/;
    return tinRegex.test(tin.replace(/\s/g, ''));
  }

  private isValidSSS(sss: string): boolean {
    // SSS format: XX-XXXXXXX-X or XXXXXXXXXXX (10 digits)
    const sssRegex = /^(\d{2}-\d{7}-\d{1}|\d{10})$/;
    return sssRegex.test(sss.replace(/\s/g, ''));
  }

  private isValidHDMF(hdmf: string): boolean {
    // HDMF/Pag-IBIG format: XXXX-XXXX-XXXX or XXXXXXXXXXXX (12 digits)
    const hdmfRegex = /^(\d{4}-\d{4}-\d{4}|\d{12})$/;
    return hdmfRegex.test(hdmf.replace(/\s/g, ''));
  }

  private isValidPhilHealth(phc: string): boolean {
    // PhilHealth format: XX-XXXXXXXXX-X or XXXXXXXXXXXXX (12 digits)
    const phcRegex = /^(\d{2}-\d{9}-\d{1}|\d{12})$/;
    return phcRegex.test(phc.replace(/\s/g, ''));
  }

  private async hasCircularReference(
    record: EmployeeImportTemp,
    allRecords: EmployeeImportTemp[],
  ): Promise<boolean> {
    const visited = new Set<string>();
    let current = record.reportsTo;

    while (current) {
      if (visited.has(current)) {
        return true; // Circular reference found
      }
      if (current === record.employeeCode) {
        return true; // Reports to themselves through chain
      }

      visited.add(current);

      // Find next in chain
      const next = allRecords.find((r) => r.employeeCode === current);
      current = next?.reportsTo;
    }

    return false;
  }

  private async findSimilarEmployee(record: EmployeeImportTemp) {
    return this.prisma.account
      .findFirst({
        where: {
          companyId: this.utilityService.companyId,
          firstName: { equals: record.firstName, mode: 'insensitive' },
          lastName: { equals: record.lastName, mode: 'insensitive' },
        },
        include: {
          EmployeeData: true,
        },
      })
      .then((account) => {
        if (account?.EmployeeData) {
          return {
            firstName: account.firstName,
            lastName: account.lastName,
            employeeCode: account.EmployeeData.employeeCode,
          };
        }
        return null;
      });
  }

  private emitProgress(batchId: string, data: any) {
    this.socketService.emitToClients(
      [this.utilityService.accountInformation.id],
      'import-progress',
      {
        batchId,
        ...data,
      },
    );
  }
}
