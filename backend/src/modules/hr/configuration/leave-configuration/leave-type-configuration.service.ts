import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { Prisma } from '@prisma/client';
import {
  LeaveTypeResponse,
  LeaveTypeTreeResponse,
  LeaveTypeListResponse,
  LeaveTypeStatus,
  LeaveTypeDates,
  LeaveTypeStatistics,
  FormattedLeavePlan,
} from '@shared/response/leave-type-response.interface';

@Injectable()
export class LeaveTypeConfigurationService {
  constructor(
    private prisma: PrismaService,
    private utilityService: UtilityService,
  ) {}

  async createLeaveType(data: {
    name: string;
    code: string;
    description?: string;
  }): Promise<LeaveTypeResponse> {
    // Validate input data
    if (!data.name?.trim()) {
      throw new BadRequestException('Leave type name is required');
    }

    if (!data.code?.trim()) {
      throw new BadRequestException('Leave type code is required');
    }

    // Normalize the code to uppercase (DTO already validates format)
    const normalizedCode = data.code.trim().toUpperCase();

    // Check if code already exists for this company
    const existingLeaveType =
      await this.prisma.leaveTypeConfiguration.findFirst({
        where: {
          code: normalizedCode,
          companyId: this.utilityService.companyId,
        },
      });

    if (existingLeaveType) {
      throw new ConflictException(
        `Leave type with code '${normalizedCode}' already exists. Please use a different code.`,
      );
    }

    try {
      const createdLeaveType = await this.prisma.leaveTypeConfiguration.create({
        data: {
          ...data,
          name: data.name.trim(),
          code: normalizedCode,
          description: data.description?.trim() || null,
          companyId: this.utilityService.companyId,
        },
        include: {
          leavePlans: {
            where: { isActive: true },
            include: {
              _count: {
                select: { employeeLeavePlans: true },
              },
            },
          },
          _count: {
            select: { leavePlans: true },
          },
        },
      });

      return this.formatLeaveType(createdLeaveType);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Handle race condition where another request created the same code
          throw new ConflictException(
            `Leave type with code '${normalizedCode}' already exists. Please use a different code.`,
          );
        }
      }
      throw error;
    }
  }

  async updateLeaveType(
    id: number,
    data: {
      name?: string;
      code?: string;
      description?: string;
    },
  ): Promise<LeaveTypeResponse> {
    // Check if leave type exists and belongs to company
    const existingLeaveType =
      await this.prisma.leaveTypeConfiguration.findFirst({
        where: {
          id,
          companyId: this.utilityService.companyId,
        },
      });

    if (!existingLeaveType) {
      throw new BadRequestException(`Leave type with ID ${id} not found`);
    }

    // Prepare update data
    const updateData: any = {};

    if (data.name !== undefined) {
      if (!data.name?.trim()) {
        throw new BadRequestException('Leave type name cannot be empty');
      }
      updateData.name = data.name.trim();
    }

    if (data.code !== undefined) {
      if (!data.code?.trim()) {
        throw new BadRequestException('Leave type code cannot be empty');
      }

      const normalizedCode = data.code.trim().toUpperCase();

      // Only check for duplicates if the code is actually changing
      if (normalizedCode !== existingLeaveType.code) {
        const codeExists = await this.prisma.leaveTypeConfiguration.findFirst({
          where: {
            code: normalizedCode,
            companyId: this.utilityService.companyId,
            NOT: { id },
          },
        });

        if (codeExists) {
          throw new ConflictException(
            `Leave type with code '${normalizedCode}' already exists. Please use a different code.`,
          );
        }
      }

      updateData.code = normalizedCode;
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }

    try {
      const updatedLeaveType = await this.prisma.leaveTypeConfiguration.update({
        where: { id },
        data: updateData,
        include: {
          leavePlans: {
            where: { isActive: true },
            include: {
              _count: {
                select: { employeeLeavePlans: true },
              },
            },
          },
          _count: {
            select: { leavePlans: true },
          },
        },
      });

      return this.formatLeaveType(updatedLeaveType);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Leave type with code '${updateData.code}' already exists. Please use a different code.`,
          );
        }
        if (error.code === 'P2025') {
          throw new BadRequestException(`Leave type with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  async archiveLeaveType(id: number): Promise<LeaveTypeResponse> {
    // Check if leave type exists and belongs to company
    const existingLeaveType =
      await this.prisma.leaveTypeConfiguration.findFirst({
        where: {
          id,
          companyId: this.utilityService.companyId,
        },
      });

    if (!existingLeaveType) {
      throw new BadRequestException(`Leave type with ID ${id} not found`);
    }

    if (!existingLeaveType.isActive) {
      throw new BadRequestException(
        `Leave type with ID ${id} is already archived`,
      );
    }

    try {
      const archivedLeaveType = await this.prisma.leaveTypeConfiguration.update(
        {
          where: { id },
          data: { isActive: false },
          include: {
            leavePlans: {
              where: { isActive: true },
              include: {
                _count: {
                  select: { employeeLeavePlans: true },
                },
              },
            },
            _count: {
              select: { leavePlans: true },
            },
          },
        },
      );

      return this.formatLeaveType(archivedLeaveType);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException(`Leave type with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  async getLeaveTypeTree(): Promise<LeaveTypeTreeResponse[]> {
    const leaveTypes = await this.prisma.leaveTypeConfiguration.findMany({
      where: {
        isActive: true,
        parentId: null, // Only get root leave types
        companyId: this.utilityService.companyId,
      },
      include: {
        leavePlans: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            planName: true,
            isActive: true,
            _count: {
              select: {
                employeeLeavePlans: true,
              },
            },
          },
        },
        _count: {
          select: {
            leavePlans: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return this.formatLeaveTypeTree(leaveTypes);
  }

  async getLeaveTypeById(id: number): Promise<LeaveTypeResponse> {
    const leaveType = await this.prisma.leaveTypeConfiguration.findFirst({
      where: {
        id,
        companyId: this.utilityService.companyId,
      },
      include: {
        leavePlans: {
          where: {
            isActive: true,
          },
          include: {
            _count: {
              select: { employeeLeavePlans: true },
            },
          },
        },
        _count: {
          select: { leavePlans: true },
        },
      },
    });

    if (!leaveType) {
      throw new BadRequestException(`Leave type with ID ${id} not found`);
    }

    return this.formatLeaveType(leaveType);
  }

  async getInitializationStatus(): Promise<{
    initialized: boolean;
    leaveTypeCount: number;
    hasDefaultTypes: boolean;
  }> {
    const company = await this.prisma.company.findUnique({
      where: { id: this.utilityService.companyId },
      select: { hasInitializedLeaveTypes: true },
    });

    const leaveTypeCount = await this.prisma.leaveTypeConfiguration.count({
      where: {
        companyId: this.utilityService.companyId,
        isActive: true,
      },
    });

    // Check if any of the default codes exist
    const defaultCodes = [
      'VL',
      'SL',
      'EL',
      'ML',
      'PL',
      'SIL',
      'BL',
      'MRL',
      'SPL',
      'STL',
    ];
    const defaultTypeCount = await this.prisma.leaveTypeConfiguration.count({
      where: {
        companyId: this.utilityService.companyId,
        code: { in: defaultCodes },
        isActive: true,
      },
    });

    return {
      initialized: company?.hasInitializedLeaveTypes || false,
      leaveTypeCount,
      hasDefaultTypes: defaultTypeCount > 0,
    };
  }

  async createDefaultLeaveTypes(): Promise<{
    initialized: boolean;
    alreadyInitialized: boolean;
    createdTypes: LeaveTypeListResponse;
    existingTypes: LeaveTypeListResponse;
    allTypes: LeaveTypeListResponse;
  }> {
    // Check if company has already initialized leave types
    const company = await this.prisma.company.findUnique({
      where: { id: this.utilityService.companyId },
      select: { hasInitializedLeaveTypes: true },
    });

    const alreadyInitialized = company?.hasInitializedLeaveTypes || false;

    const defaultTypes = [
      {
        name: 'Vacation Leave',
        code: 'VL',
        description: 'Annual vacation leave for rest and relaxation',
      },
      {
        name: 'Sick Leave',
        code: 'SL',
        description: 'Leave for medical reasons or illness',
      },
      {
        name: 'Emergency Leave',
        code: 'EL',
        description: 'Leave for unexpected personal emergencies',
      },
      {
        name: 'Maternity Leave',
        code: 'ML',
        description: 'Leave for mothers before and after childbirth',
      },
      {
        name: 'Paternity Leave',
        code: 'PL',
        description: 'Leave for fathers after childbirth',
      },
      {
        name: 'Service Incentive Leave',
        code: 'SIL',
        description:
          'Mandated leave for employees who have rendered at least one year of service',
      },
      {
        name: 'Bereavement Leave',
        code: 'BL',
        description:
          'Leave for mourning the death of an immediate family member',
      },
      {
        name: 'Marriage Leave',
        code: 'MRL',
        description: 'Leave for employees getting married',
      },
      {
        name: 'Solo Parent Leave',
        code: 'SPL',
        description: 'Additional leave benefit for solo parents',
      },
      {
        name: 'Study Leave',
        code: 'STL',
        description: 'Leave for pursuing further education or training',
      },
    ];

    const createdTypes = [];
    const existingTypes = [];

    for (const type of defaultTypes) {
      const existing = await this.prisma.leaveTypeConfiguration.findFirst({
        where: {
          code: type.code,
          companyId: this.utilityService.companyId,
        },
        include: {
          leavePlans: {
            where: { isActive: true },
            include: {
              _count: {
                select: { employeeLeavePlans: true },
              },
            },
          },
          _count: {
            select: { leavePlans: true },
          },
        },
      });

      if (existing) {
        existingTypes.push(existing);
      } else {
        const created = await this.prisma.leaveTypeConfiguration.create({
          data: {
            ...type,
            companyId: this.utilityService.companyId,
          },
          include: {
            leavePlans: {
              where: { isActive: true },
              include: {
                _count: {
                  select: { employeeLeavePlans: true },
                },
              },
            },
            _count: {
              select: { leavePlans: true },
            },
          },
        });
        createdTypes.push(created);
      }
    }

    // Update company initialization status if not already done
    if (!alreadyInitialized && createdTypes.length > 0) {
      await this.prisma.company.update({
        where: { id: this.utilityService.companyId },
        data: { hasInitializedLeaveTypes: true },
      });
    }

    // Get all leave types for the company
    const allTypes = [...createdTypes, ...existingTypes];

    return {
      initialized: createdTypes.length > 0,
      alreadyInitialized,
      createdTypes: this.formatLeaveTypeList(createdTypes),
      existingTypes: this.formatLeaveTypeList(existingTypes),
      allTypes: this.formatLeaveTypeList(allTypes),
    };
  }

  // Private formatting methods
  private formatStatus(isActive: boolean): LeaveTypeStatus {
    return {
      isActive,
      label: isActive ? 'Active' : 'Inactive',
      badge: isActive ? 'success' : 'danger',
    };
  }

  private formatDates(createdAt: Date, updatedAt: Date): LeaveTypeDates {
    return {
      createdAt: this.utilityService.formatDate(createdAt),
      updatedAt: this.utilityService.formatDate(updatedAt),
    };
  }

  private formatStatistics(leaveType: any): LeaveTypeStatistics {
    const totalPlans = leaveType._count?.leavePlans || 0;
    const activePlans = leaveType.leavePlans?.length || 0;

    // Calculate total employees from all plans
    const totalEmployees =
      leaveType.leavePlans?.reduce((sum: number, plan: any) => {
        return sum + (plan._count?.employeeLeavePlans || 0);
      }, 0) || 0;

    return {
      totalPlans,
      activePlans,
      totalEmployees,
      activeEmployees: totalEmployees, // For now, assume all are active
    };
  }

  private formatLeavePlans(leavePlans: any[]): FormattedLeavePlan[] {
    if (!leavePlans) return [];

    return leavePlans.map((plan) => ({
      id: plan.id,
      planName: plan.planName,
      isActive: plan.isActive,
      employeeCount: plan._count?.employeeLeavePlans || 0,
    }));
  }

  private formatLeaveType(leaveType: any): LeaveTypeResponse {
    return {
      id: leaveType.id,
      name: leaveType.name,
      code: leaveType.code,
      description: leaveType.description,
      parentId: leaveType.parentId,
      status: this.formatStatus(leaveType.isActive),
      dates: this.formatDates(leaveType.createdAt, leaveType.updatedAt),
      statistics: this.formatStatistics(leaveType),
      leavePlans: this.formatLeavePlans(leaveType.leavePlans),
    };
  }

  private formatLeaveTypeTree(leaveTypes: any[]): LeaveTypeTreeResponse[] {
    return leaveTypes.map((leaveType) => ({
      ...this.formatLeaveType(leaveType),
      children: leaveType.children
        ? this.formatLeaveTypeTree(leaveType.children)
        : undefined,
    }));
  }

  private formatLeaveTypeList(leaveTypes: any[]): LeaveTypeListResponse {
    const formattedLeaveTypes = leaveTypes.map((lt) =>
      this.formatLeaveType(lt),
    );

    const activeCount = formattedLeaveTypes.filter(
      (lt) => lt.status.isActive,
    ).length;
    const inactiveCount = formattedLeaveTypes.length - activeCount;
    const totalPlans = formattedLeaveTypes.reduce(
      (sum, lt) => sum + lt.statistics.totalPlans,
      0,
    );
    const totalEmployees = formattedLeaveTypes.reduce(
      (sum, lt) => sum + lt.statistics.totalEmployees,
      0,
    );

    return {
      leaveTypes: formattedLeaveTypes,
      total: formattedLeaveTypes.length,
      metadata: {
        activeCount,
        inactiveCount,
        totalPlans,
        totalEmployees,
      },
    };
  }
}
