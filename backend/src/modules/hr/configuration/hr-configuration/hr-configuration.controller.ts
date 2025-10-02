import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { PrismaService } from '@common/prisma.service';
import { EmploymentStatus } from '@prisma/client';

@Controller('hr-configuration')
export class HrConfigurationController {
  constructor(
    private readonly utilityService: UtilityService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('employee-filter-options')
  async getEmployeeFilterOptions(@Res() res: Response) {
    const companyId = this.utilityService.companyId;

    // Get branches (projects in this case)
    const branches = await this.prisma.project.findMany({
      where: { companyId, isDeleted: false },
      select: { id: true, name: true },
    });

    // Get roles
    const roles = await this.prisma.role.findMany({
      where: { companyId, isDeleted: false },
      select: { id: true, name: true },
    });

    // Get payroll groups
    const payrollGroups = await this.prisma.payrollGroup.findMany({
      where: { companyId, isDeleted: false },
      select: { id: true, payrollGroupCode: true },
    });

    // Get employment statuses from enum
    const employmentStatuses = Object.values(EmploymentStatus).map(
      (status) => ({
        value: status,
        label: this.formatEmploymentStatus(status),
      }),
    );

    const filterOptions = {
      branches: [
        { value: 'all', label: 'All Branches' },
        ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
      ],
      roles: [
        { value: 'all', label: 'All Roles' },
        ...roles.map((role) => ({ value: role.id, label: role.name })),
      ],
      employmentStatuses: [
        { value: 'all', label: 'All Employment Status' },
        ...employmentStatuses,
      ],
      payrollGroups: [
        { value: 'all', label: 'All Payroll Groups' },
        ...payrollGroups.map((group) => ({
          value: group.id,
          label: group.payrollGroupCode,
        })),
      ],
    };

    return this.utilityService.responseHandler(
      Promise.resolve(filterOptions),
      res,
    );
  }

  private formatEmploymentStatus(status: EmploymentStatus): string {
    switch (status) {
      case EmploymentStatus.REGULAR:
        return 'Regular';
      case EmploymentStatus.CONTRACTTUAL:
        return 'Contractual';
      case EmploymentStatus.PROBATIONARY:
        return 'Probationary';
      case EmploymentStatus.TRAINEE:
        return 'Trainee';
      default:
        return status;
    }
  }
}
