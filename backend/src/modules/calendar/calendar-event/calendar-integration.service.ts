import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';

export interface CalendarIntegrationEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string;
  sourceType: 'task' | 'shift' | 'leave' | 'project' | 'local-holiday' | 'national-holiday';
  sourceData: any;
}

@Injectable()
export class CalendarIntegrationService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utility: UtilityService;

  /**
   * Get personal calendar events (tasks, shifts, leaves)
   */
  async getPersonalCalendarEvents(startDate: string, endDate: string): Promise<CalendarIntegrationEvent[]> {
    const accountId = this.utility.accountInformation.id;
    const companyId = this.utility.accountInformation.company?.id;

    if (!companyId) {
      throw new BadRequestException('Company ID not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const events: CalendarIntegrationEvent[] = [];

    // 1. Get Tasks with due dates
    const tasks = await this.getPersonalTasks(accountId, start, end);
    events.push(...tasks);

    // 2. Get Shift schedules
    const shifts = await this.getPersonalShifts(accountId, companyId, start, end);
    events.push(...shifts);

    // 3. Get Personal leaves
    const leaves = await this.getPersonalLeaves(accountId, start, end);
    events.push(...leaves);

    return events;
  }

  /**
   * Get company calendar events (projects, leaves, holidays)
   */
  async getCompanyCalendarEvents(startDate: string, endDate: string): Promise<CalendarIntegrationEvent[]> {
    const companyId = this.utility.accountInformation.company?.id;

    if (!companyId) {
      throw new BadRequestException('Company ID not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const events: CalendarIntegrationEvent[] = [];

    // 1. Get Project deadlines
    const projects = await this.getCompanyProjects(companyId, start, end);
    events.push(...projects);

    // 2. Get All employee leaves
    const leaves = await this.getCompanyLeaves(companyId, start, end);
    events.push(...leaves);

    // 3. Get Holidays (Local and National)
    const holidays = await this.getCompanyHolidays(companyId, start, end);
    events.push(...holidays);

    return events;
  }

  /**
   * Get personal tasks with due dates
   */
  private async getPersonalTasks(accountId: string, start: Date, end: Date): Promise<CalendarIntegrationEvent[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        assignedToId: accountId,
        isDeleted: false,
        dueDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        boardLane: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        start: task.dueDate!,
        end: task.dueDate!,
        allDay: true,
        color: '#FF6B6B', // Red for tasks
        sourceType: 'task' as const,
        sourceData: {
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          assignedTo: task.assignedTo,
          project: task.project,
          boardLane: task.boardLane,
          priorityLevel: task.priorityLevel,
          isOpen: task.isOpen,
        },
      }));
  }

  /**
   * Get personal shift schedules
   */
  private async getPersonalShifts(
    accountId: string,
    companyId: number,
    start: Date,
    end: Date,
  ): Promise<CalendarIntegrationEvent[]> {
    // Generate date strings for the range
    const dateStrings: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      dateStrings.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    const schedules = await this.prisma.individualScheduleAssignment.findMany({
      where: {
        employeeId: accountId,
        companyId,
        date: {
          in: dateStrings,
        },
      },
      include: {
        shift: {
          include: {
            shiftTime: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return schedules
      .filter((schedule) => schedule.shift)
      .map((schedule) => {
        const shiftDate = new Date(schedule.date);
        const firstShiftTime = schedule.shift!.shiftTime.find((st) => !st.isBreakTime);

        let startDateTime = shiftDate;
        let endDateTime = shiftDate;

        if (firstShiftTime) {
          const [startHour, startMin] = firstShiftTime.startTime.split(':').map(Number);
          const [endHour, endMin] = firstShiftTime.endTime.split(':').map(Number);

          startDateTime = new Date(shiftDate);
          startDateTime.setHours(startHour, startMin, 0, 0);

          endDateTime = new Date(shiftDate);
          endDateTime.setHours(endHour, endMin, 0, 0);

          // Handle overnight shifts
          if (endDateTime < startDateTime) {
            endDateTime.setDate(endDateTime.getDate() + 1);
          }
        }

        return {
          id: `shift-${schedule.id}`,
          title: `Shift: ${schedule.shift!.shiftCode}`,
          start: startDateTime,
          end: endDateTime,
          allDay: false,
          color: '#4ECDC4', // Teal for shifts
          sourceType: 'shift' as const,
          sourceData: {
            id: schedule.id,
            shiftCode: schedule.shift!.shiftCode,
            shiftType: schedule.shift!.shiftType,
            breakHours: schedule.shift!.breakHours,
            targetHours: schedule.shift!.targetHours,
            shiftTime: schedule.shift!.shiftTime,
            project: schedule.project,
            date: schedule.date,
          },
        };
      });
  }

  /**
   * Get personal leaves (filed by user)
   */
  private async getPersonalLeaves(accountId: string, start: Date, end: Date): Promise<CalendarIntegrationEvent[]> {
    const leaves = await this.prisma.payrollFiling.findMany({
      where: {
        accountId,
        filingType: 'LEAVE',
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return leaves
      .filter((leave) => leave.date && leave.leaveData)
      .map((leave) => {
        const leaveData = leave.leaveData as any;
        const startDate = leaveData?.startDate ? new Date(leaveData.startDate) : leave.date;
        const endDate = leaveData?.endDate ? new Date(leaveData.endDate) : leave.date;

        return {
          id: `leave-${leave.id}`,
          title: `Leave: ${leaveData?.leaveType || leave.filingType}`,
          start: startDate!,
          end: endDate!,
          allDay: true,
          color: '#95E1D3', // Mint for personal leaves
          sourceType: 'leave' as const,
          sourceData: {
            id: leave.id,
            filingType: leave.filingType,
            date: leave.date,
            status: leave.status,
            remarks: leave.remarks,
            hours: leave.hours,
            isApproved: leave.isApproved,
            leaveData: leaveData,
            account: leave.account,
          },
        };
      });
  }

  /**
   * Get company projects with deadlines
   */
  private async getCompanyProjects(companyId: number, start: Date, end: Date): Promise<CalendarIntegrationEvent[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        companyId,
        isDeleted: false,
        OR: [
          {
            startDate: {
              gte: start,
              lte: end,
            },
          },
          {
            endDate: {
              gte: start,
              lte: end,
            },
          },
        ],
      },
      include: {
        personInCharge: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    const events: CalendarIntegrationEvent[] = [];

    projects.forEach((project) => {
      // Add project start date event
      if (project.startDate >= start && project.startDate <= end) {
        events.push({
          id: `project-start-${project.id}`,
          title: `Project Start: ${project.name}`,
          start: new Date(project.startDate),
          end: new Date(project.startDate),
          allDay: true,
          color: '#F38181', // Coral for projects
          sourceType: 'project' as const,
          sourceData: {
            id: project.id,
            name: project.name,
            description: project.description,
            startDate: project.startDate,
            endDate: project.endDate,
            status: project.status,
            budget: project.budget,
            personInCharge: project.personInCharge,
            client: project.client,
            progressPercentage: project.progressPercentage,
            eventType: 'start',
          },
        });
      }

      // Add project end date event (deadline)
      if (project.endDate >= start && project.endDate <= end) {
        events.push({
          id: `project-end-${project.id}`,
          title: `Project Deadline: ${project.name}`,
          start: new Date(project.endDate),
          end: new Date(project.endDate),
          allDay: true,
          color: '#F38181', // Coral for projects
          sourceType: 'project' as const,
          sourceData: {
            id: project.id,
            name: project.name,
            description: project.description,
            startDate: project.startDate,
            endDate: project.endDate,
            status: project.status,
            budget: project.budget,
            personInCharge: project.personInCharge,
            client: project.client,
            progressPercentage: project.progressPercentage,
            eventType: 'deadline',
          },
        });
      }
    });

    return events;
  }

  /**
   * Get all company employee leaves
   */
  private async getCompanyLeaves(companyId: number, start: Date, end: Date): Promise<CalendarIntegrationEvent[]> {
    const leaves = await this.prisma.payrollFiling.findMany({
      where: {
        account: {
          companyId,
        },
        filingType: 'LEAVE',
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return leaves
      .filter((leave) => leave.date && leave.leaveData)
      .map((leave) => {
        const leaveData = leave.leaveData as any;
        const startDate = leaveData?.startDate ? new Date(leaveData.startDate) : leave.date;
        const endDate = leaveData?.endDate ? new Date(leaveData.endDate) : leave.date;

        return {
          id: `company-leave-${leave.id}`,
          title: `${leave.account.firstName} ${leave.account.lastName} - ${leaveData?.leaveType || 'Leave'}`,
          start: startDate!,
          end: endDate!,
          allDay: true,
          color: '#FFA07A', // Light Salmon for company leaves
          sourceType: 'leave' as const,
          sourceData: {
            id: leave.id,
            filingType: leave.filingType,
            date: leave.date,
            status: leave.status,
            remarks: leave.remarks,
            hours: leave.hours,
            isApproved: leave.isApproved,
            leaveData: leaveData,
            account: leave.account,
            isCompanyWide: true,
          },
        };
      });
  }

  /**
   * Get company holidays (local and national)
   */
  private async getCompanyHolidays(companyId: number, start: Date, end: Date): Promise<CalendarIntegrationEvent[]> {
    // Get local holidays
    const localHolidays = await this.prisma.localHoliday.findMany({
      where: {
        companyId,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        province: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const events: CalendarIntegrationEvent[] = [];

    // Map local holidays
    localHolidays.forEach((holiday) => {
      events.push({
        id: `holiday-${holiday.id}`,
        title: holiday.name,
        start: new Date(holiday.date),
        end: new Date(holiday.date),
        allDay: true,
        color: holiday.type === 'REGULAR' ? '#6BCB77' : '#FFD93D', // Green for regular, Yellow for special
        sourceType: holiday.type === 'REGULAR' ? 'national-holiday' : 'local-holiday',
        sourceData: {
          id: holiday.id,
          name: holiday.name,
          date: holiday.date,
          type: holiday.type,
          province: holiday.province,
        },
      });
    });

    return events;
  }
}
