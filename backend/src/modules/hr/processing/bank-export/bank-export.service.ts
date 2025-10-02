import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { BankFormatterFactory } from './factories/bank-formatter.factory';
import { IExportResult } from './interfaces/bank-export.interface';

interface PaginationOptions {
  page: number;
  limit: number;
  search: string;
  bankKey: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class BankExportService {
  constructor(
    private prisma: PrismaService,
    private bankFormatterFactory: BankFormatterFactory,
  ) {}

  async getBankGroupedData(
    cutoffDateRangeId: string,
    options?: PaginationOptions,
  ) {
    const {
      page = 1,
      limit = 25,
      search = '',
      bankKey = '',
      sortBy = 'netPay',
      sortOrder = 'desc',
    } = options || {};

    // Build where condition for search
    const searchCondition = search
      ? {
          OR: [
            {
              account: {
                firstName: { contains: search, mode: 'insensitive' as any },
              },
            },
            {
              account: {
                lastName: { contains: search, mode: 'insensitive' as any },
              },
            },
            {
              account: {
                EmployeeData: {
                  employeeCode: {
                    contains: search,
                    mode: 'insensitive' as any,
                  },
                },
              },
            },
            {
              account: {
                EmployeeData: {
                  branch: {
                    name: { contains: search, mode: 'insensitive' as any },
                  },
                },
              },
            },
          ],
        }
      : {};

    const baseWhere = {
      cutoffDateRangeId,
      ...searchCondition,
    };

    if (!bankKey) {
      // Return summary data (bank counts and totals) + paginated "No Bank" employees

      // Get bank summary (for tabs)
      const allEmployeesGrouped = await this.getAllEmployeesGroupedByBank(
        cutoffDateRangeId,
        search,
      );

      // Get paginated "No Bank" employees
      const noBankWhere = {
        ...baseWhere,
        account: {
          EmployeeData: {
            OR: [
              { bankName: null },
              { bankName: '' },
              { bankAccountNumber: null },
              { bankAccountNumber: '' },
            ],
          },
        },
      };

      const [noBankEmployees, noBankTotal] = await Promise.all([
        this.prisma.employeeTimekeepingCutoff.findMany({
          where: noBankWhere,
          include: {
            account: {
              include: {
                EmployeeData: {
                  include: {
                    branch: true,
                  },
                },
              },
            },
            EmployeeSalaryComputation: true,
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy:
            sortBy === 'netPay'
              ? {
                  EmployeeSalaryComputation: {
                    netPay: sortOrder,
                  },
                }
              : {
                  account: {
                    lastName: sortOrder,
                  },
                },
        }),
        this.prisma.employeeTimekeepingCutoff.count({
          where: noBankWhere,
        }),
      ]);

      const formattedNoBankEmployees = noBankEmployees
        .filter(
          (emp) => emp.account.EmployeeData && emp.EmployeeSalaryComputation,
        )
        .map((emp) => ({
          employeeName: this.capitalizeEmployeeName(
            emp.account.lastName,
            emp.account.firstName,
          ),
          employeeCode: emp.account.EmployeeData.employeeCode || 'N/A',
          branchName: emp.account.EmployeeData.branch?.name || 'N/A',
          netPay: emp.EmployeeSalaryComputation.netPay,
        }));

      return {
        noBankEmployees: {
          employeeCount: noBankTotal,
          totalAmount: formattedNoBankEmployees.reduce(
            (sum, emp) => sum + emp.netPay,
            0,
          ),
          employees: formattedNoBankEmployees,
          pagination: {
            page,
            limit,
            total: noBankTotal,
            totalPages: Math.ceil(noBankTotal / limit),
          },
        },
        banks: allEmployeesGrouped.banks,
      };
    } else {
      // Return paginated employees for specific bank
      const bankWhere = {
        ...baseWhere,
        account: {
          EmployeeData: {
            bankName: bankKey,
            bankAccountNumber: { not: null },
          },
        },
      };

      const [bankEmployees, bankTotal] = await Promise.all([
        this.prisma.employeeTimekeepingCutoff.findMany({
          where: bankWhere,
          include: {
            account: {
              include: {
                EmployeeData: {
                  include: {
                    branch: true,
                  },
                },
              },
            },
            EmployeeSalaryComputation: true,
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy:
            sortBy === 'netPay'
              ? {
                  EmployeeSalaryComputation: {
                    netPay: sortOrder,
                  },
                }
              : {
                  account: {
                    lastName: sortOrder,
                  },
                },
        }),
        this.prisma.employeeTimekeepingCutoff.count({
          where: bankWhere,
        }),
      ]);

      const formattedBankEmployees = bankEmployees
        .filter(
          (emp) => emp.account.EmployeeData && emp.EmployeeSalaryComputation,
        )
        .map((emp) => ({
          employeeName: this.capitalizeEmployeeName(
            emp.account.lastName,
            emp.account.firstName,
          ),
          employeeCode: emp.account.EmployeeData.employeeCode || 'N/A',
          branchName: emp.account.EmployeeData.branch?.name || 'N/A',
          bankAccountNumber: emp.account.EmployeeData.bankAccountNumber,
          netPay: emp.EmployeeSalaryComputation.netPay,
        }));

      // Get bank label
      const philippineBanks = await import(
        '../../../../reference/philippine-banks.reference'
      );

      // Create multiple lookup maps for flexibility
      const bankMap = new Map<string, string>();
      const bankMapLower = new Map<string, string>();
      const bankMapByLabel = new Map<string, string>();

      philippineBanks.default.forEach((bank) => {
        bankMap.set(bank.key, bank.label);
        bankMapLower.set(bank.key.toLowerCase(), bank.label);
        // Also map by partial label match for common abbreviations
        const labelLower = bank.label.toLowerCase();
        bankMapByLabel.set(labelLower, bank.label);
        // Extract common abbreviations from label (e.g., "BDO" from "Banco de Oro (BDO)")
        const match = bank.label.match(/\(([^)]+)\)/);
        if (match) {
          bankMapLower.set(match[1].toLowerCase(), bank.label);
        }
      });

      // Try multiple ways to find the bank label
      let bankLabel =
        bankMap.get(bankKey) ||
        bankMapLower.get(bankKey.toLowerCase()) ||
        bankMapByLabel.get(bankKey.toLowerCase()) ||
        bankKey; // Fallback to key if no match found

      // Remove abbreviation in parentheses from bank label
      bankLabel = bankLabel.replace(/\s*\([^)]+\)\s*$/, '').trim();

      return {
        bankKey,
        bankLabel,
        employeeCount: bankTotal,
        totalAmount: formattedBankEmployees.reduce(
          (sum, emp) => sum + emp.netPay,
          0,
        ),
        employees: formattedBankEmployees,
        pagination: {
          page,
          limit,
          total: bankTotal,
          totalPages: Math.ceil(bankTotal / limit),
        },
      };
    }
  }

  private async getAllEmployeesGroupedByBank(
    cutoffDateRangeId: string,
    search = '',
  ) {
    const searchCondition = search
      ? {
          OR: [
            {
              account: {
                firstName: { contains: search, mode: 'insensitive' as any },
              },
            },
            {
              account: {
                lastName: { contains: search, mode: 'insensitive' as any },
              },
            },
            {
              account: {
                EmployeeData: {
                  employeeCode: {
                    contains: search,
                    mode: 'insensitive' as any,
                  },
                },
              },
            },
            {
              account: {
                EmployeeData: {
                  branch: {
                    name: { contains: search, mode: 'insensitive' as any },
                  },
                },
              },
            },
          ],
        }
      : {};

    // Get detailed bank data for summary
    const bankEmployees = await this.prisma.employeeTimekeepingCutoff.findMany({
      where: {
        cutoffDateRangeId,
        account: {
          EmployeeData: {
            bankName: { not: null },
            bankAccountNumber: { not: null },
          },
        },
        ...searchCondition,
      },
      include: {
        account: {
          include: {
            EmployeeData: true,
          },
        },
        EmployeeSalaryComputation: true,
      },
    });

    // Group by bank
    const bankGroups = new Map<
      string,
      { count: number; totalAmount: number }
    >();

    for (const emp of bankEmployees) {
      if (!emp.account.EmployeeData || !emp.EmployeeSalaryComputation) continue;

      const bankName = emp.account.EmployeeData.bankName;
      if (!bankName) continue;

      if (!bankGroups.has(bankName)) {
        bankGroups.set(bankName, { count: 0, totalAmount: 0 });
      }

      const group = bankGroups.get(bankName)!;
      group.count += 1;
      group.totalAmount += emp.EmployeeSalaryComputation.netPay;
    }

    // Get bank labels
    const philippineBanks = await import(
      '../../../../reference/philippine-banks.reference'
    );

    // Create multiple lookup maps for flexibility
    const bankMap = new Map<string, string>();
    const bankMapLower = new Map<string, string>();
    const bankMapByLabel = new Map<string, string>();

    philippineBanks.default.forEach((bank) => {
      bankMap.set(bank.key, bank.label);
      bankMapLower.set(bank.key.toLowerCase(), bank.label);
      // Also map by partial label match for common abbreviations
      const labelLower = bank.label.toLowerCase();
      bankMapByLabel.set(labelLower, bank.label);
      // Extract common abbreviations from label (e.g., "BDO" from "Banco de Oro (BDO)")
      const match = bank.label.match(/\(([^)]+)\)/);
      if (match) {
        bankMapLower.set(match[1].toLowerCase(), bank.label);
      }
    });

    const banks = Array.from(bankGroups.entries())
      .map(([bankKey, data]) => {
        // Try multiple ways to find the bank label
        let bankLabel =
          bankMap.get(bankKey) ||
          bankMapLower.get(bankKey.toLowerCase()) ||
          bankMapByLabel.get(bankKey.toLowerCase()) ||
          bankKey; // Fallback to key if no match found

        // Remove abbreviation in parentheses from bank label
        bankLabel = bankLabel.replace(/\s*\([^)]+\)\s*$/, '').trim();

        return {
          bankKey,
          bankLabel,
          employeeCount: data.count,
          totalAmount: data.totalAmount,
          employees: [], // Will be populated when specific bank is requested
        };
      })
      .sort((a, b) => b.employeeCount - a.employeeCount);

    return { banks };
  }

  async exportBankData(
    cutoffDateRangeId: string,
    bankKey: string,
  ): Promise<IExportResult> {
    // Get all employees for this bank (no pagination for export)
    const bankEmployees = await this.prisma.employeeTimekeepingCutoff.findMany({
      where: {
        cutoffDateRangeId,
        account: {
          EmployeeData: {
            bankName: bankKey,
            bankAccountNumber: { not: null },
          },
        },
      },
      include: {
        account: {
          include: {
            EmployeeData: {
              include: {
                branch: true,
              },
            },
          },
        },
        EmployeeSalaryComputation: true,
      },
      orderBy: {
        EmployeeSalaryComputation: {
          netPay: 'desc',
        },
      },
    });

    const employees = bankEmployees
      .filter(
        (emp) => emp.account.EmployeeData && emp.EmployeeSalaryComputation,
      )
      .map((emp) => ({
        employeeName: this.capitalizeEmployeeName(
          emp.account.lastName,
          emp.account.firstName,
        ),
        employeeCode: emp.account.EmployeeData.employeeCode || 'N/A',
        branchName: emp.account.EmployeeData.branch?.name || 'N/A',
        bankAccountNumber: emp.account.EmployeeData.bankAccountNumber,
        netPay: emp.EmployeeSalaryComputation.netPay,
      }));

    if (employees.length === 0) {
      throw new Error('No employees found for this bank');
    }

    const formatter = this.bankFormatterFactory.getFormatter(bankKey);
    const content = formatter.format(employees);
    const extension = formatter.getFileExtension();
    const contentType = formatter.getContentType();

    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `${bankKey}_Payroll_${date}.${extension}`;

    return { content, filename, contentType };
  }

  private capitalizeEmployeeName(lastName: string, firstName: string): string {
    const capitalizeName = (name: string): string => {
      return name
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    return `${capitalizeName(lastName)}, ${capitalizeName(firstName)}`;
  }
}
