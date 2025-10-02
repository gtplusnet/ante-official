import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  BulkScheduleAssignmentDTO,
  GetScheduleAssignmentsDTO,
  ScheduleAssignmentResponse,
  TeamScheduleForEmployeeResponse,
} from './individual-schedule-assignment.interface';

@Injectable()
export class IndividualScheduleAssignmentService {
  @Inject() private prisma: PrismaService;
  @Inject() private utilityService: UtilityService;

  async bulkSaveAssignments(
    data: BulkScheduleAssignmentDTO,
    updatedById: string,
  ): Promise<{ saved: number }> {
    const companyId = this.utilityService.companyId;
    let saved = 0;

    if (!updatedById) {
      throw new Error('User not authenticated');
    }

    // Process each assignment using upsert
    for (const assignment of data.assignments) {
      const { employeeId, date, projectId, shiftId } = assignment;

      await this.prisma.individualScheduleAssignment.upsert({
        where: {
          employeeId_date_companyId: {
            employeeId,
            date,
            companyId,
          },
        },
        update: {
          projectId,
          shiftId,
          updatedById,
        },
        create: {
          employeeId,
          date,
          projectId,
          shiftId,
          updatedById,
          companyId,
        },
      });

      saved++;
    }

    return { saved };
  }

  async getAssignments(
    query: GetScheduleAssignmentsDTO,
  ): Promise<ScheduleAssignmentResponse[]> {
    const companyId = this.utilityService.companyId;
    const { startDate, endDate, employeeIds } = query;

    // Generate all dates in the range
    const generateDateRange = (start: string, end: string): string[] => {
      const dates: string[] = [];
      const [startMonth, startDay, startYear] = start.split('/').map(Number);
      const [endMonth, endDay, endYear] = end.split('/').map(Number);

      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const year = currentDate.getFullYear();
        dates.push(`${month}/${day}/${year}`);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dates;
    };

    const dateRange = generateDateRange(startDate, endDate);

    const where: any = {
      companyId,
      date: { in: dateRange },
    };

    if (employeeIds && employeeIds.length > 0) {
      where.employeeId = { in: employeeIds };
    }

    const assignments = await this.prisma.individualScheduleAssignment.findMany(
      {
        where,
        include: {
          updatedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [{ date: 'asc' }, { employeeId: 'asc' }],
      },
    );

    return assignments;
  }

  async getTeamSchedulesForEmployees(
    query: GetScheduleAssignmentsDTO,
  ): Promise<TeamScheduleForEmployeeResponse[]> {
    const companyId = this.utilityService.companyId;
    const { startDate, endDate, employeeIds } = query;

    // Generate all dates in the range
    const generateDateRange = (start: string, end: string): string[] => {
      const dates: string[] = [];
      const [startMonth, startDay, startYear] = start.split('/').map(Number);
      const [endMonth, endDay, endYear] = end.split('/').map(Number);

      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const year = currentDate.getFullYear();
        dates.push(`${month}/${day}/${year}`);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dates;
    };

    // Convert MM/DD/YYYY to YYYY-MM-DD for database query
    const convertToDbDate = (dateStr: string): string => {
      const [month, day, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    const dateRange = generateDateRange(startDate, endDate);
    const dbDateRange = dateRange.map(convertToDbDate);

    // First, get employees with their team memberships
    const employeeWhere: any = {
      companyId,
      teamMembership: { isNot: null }, // Only employees with teams
    };

    if (employeeIds && employeeIds.length > 0) {
      employeeWhere.id = { in: employeeIds };
    }

    const employeesWithTeams = await this.prisma.account.findMany({
      where: employeeWhere,
      select: {
        id: true,
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
    });

    if (employeesWithTeams.length === 0) {
      return [];
    }

    // Get unique team IDs
    const teamIds = [
      ...new Set(
        employeesWithTeams.map((e) => e.teamMembership?.teamId).filter(Boolean),
      ),
    ];

    // Fetch team schedule assignments
    const teamSchedules = await this.prisma.teamScheduleAssignment.findMany({
      where: {
        teamId: { in: teamIds },
        date: { in: dbDateRange },
        companyId,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Map team schedules to employees
    const result: TeamScheduleForEmployeeResponse[] = [];

    for (const employee of employeesWithTeams) {
      const teamId = employee.teamMembership?.teamId;
      if (!teamId) continue;

      const teamName = employee.teamMembership?.team?.name || '';

      // Find team schedules for this employee's team
      const employeeTeamSchedules = teamSchedules.filter(
        (ts) => ts.teamId === teamId,
      );

      for (const schedule of employeeTeamSchedules) {
        // Convert date back to MM/DD/YYYY format
        const [year, month, day] = schedule.date.split('-');
        const formattedDate = `${month}/${day}/${year}`;

        result.push({
          employeeId: employee.id,
          teamId: teamId,
          teamName: teamName,
          date: formattedDate,
          projectId: schedule.projectId,
          shiftId: schedule.shiftId,
        });
      }
    }

    return result;
  }
}
