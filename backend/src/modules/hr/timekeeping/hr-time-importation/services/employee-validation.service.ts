import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  ImportTimeFromImageGeminiLog,
  ValidationError,
} from '../../../../../shared/response/import-time-from-image.response';

@Injectable()
export class EmployeeValidationService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Validate employee logs against database
   * Checks if employeeId matches employeeCode or biometricsNumber
   */
  async validateEmployeeLogs(logs: ImportTimeFromImageGeminiLog[]): Promise<{
    validLogs: ImportTimeFromImageGeminiLog[];
    invalidLogs: ImportTimeFromImageGeminiLog[];
    validationErrors: ValidationError[];
  }> {
    const validLogs: ImportTimeFromImageGeminiLog[] = [];
    const invalidLogs: ImportTimeFromImageGeminiLog[] = [];
    const validationErrors: ValidationError[] = [];

    // Get all unique employee IDs from logs
    const employeeIds = [...new Set(logs.map((log) => log.employeeId))];

    // Fetch all employees that match any of the IDs
    const employees = await this.prismaService.employeeData.findMany({
      where: {
        OR: [
          { employeeCode: { in: employeeIds } },
          { biometricsNumber: { in: employeeIds } },
        ],
        isActive: true,
      },
      select: {
        employeeCode: true,
        biometricsNumber: true,
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create a map for quick lookup
    const employeeMap = new Map<string, any>();
    employees.forEach((emp) => {
      if (emp.employeeCode) {
        employeeMap.set(emp.employeeCode, emp);
      }
      if (emp.biometricsNumber) {
        employeeMap.set(emp.biometricsNumber, emp);
      }
    });

    // Validate each log
    for (const log of logs) {
      const employee = employeeMap.get(log.employeeId);

      if (employee) {
        validLogs.push({
          ...log,
          isValid: true,
          // Optionally enhance the log with employee name
          remarks:
            log.remarks ||
            `${employee.account.firstName} ${employee.account.lastName}`,
        });
      } else {
        const invalidLog = {
          ...log,
          isValid: false,
          validationError: `Employee ID '${log.employeeId}' not found in the system`,
        };
        invalidLogs.push(invalidLog);

        validationErrors.push({
          employeeId: log.employeeId,
          error: `Employee with ID/Biometrics Number '${log.employeeId}' not found`,
          timeIn: log.timeIn,
          timeOut: log.timeOut,
        });
      }
    }

    return {
      validLogs,
      invalidLogs,
      validationErrors,
    };
  }

  /**
   * Check if all logs are valid
   */
  async areAllLogsValid(
    logs: ImportTimeFromImageGeminiLog[],
  ): Promise<boolean> {
    const { invalidLogs } = await this.validateEmployeeLogs(logs);
    return invalidLogs.length === 0;
  }

  /**
   * Get validation summary
   */
  async getValidationSummary(
    logs: ImportTimeFromImageGeminiLog[],
  ): Promise<string> {
    const { validLogs, invalidLogs } = await this.validateEmployeeLogs(logs);

    if (invalidLogs.length === 0) {
      return `All ${validLogs.length} employee(s) validated successfully.`;
    }

    const invalidIds = [...new Set(invalidLogs.map((log) => log.employeeId))];
    return `${validLogs.length} valid, ${invalidLogs.length} invalid. Invalid IDs: ${invalidIds.join(', ')}`;
  }
}
