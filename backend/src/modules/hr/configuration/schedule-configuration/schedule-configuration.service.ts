import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import {
  GetScheduleDTO,
  ScheduleUpdateDTO,
} from './schedule-configuration.interface';
import { PrismaService } from '@common/prisma.service';
import { Prisma, EmployeeData, Schedule } from '@prisma/client';
import { ShiftConfigurationService } from '../shift-configuration/shift-configuration.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { HoursFormat } from '../../../../shared/response/utility.format';
import { ScheduleDataResponse } from '../../../../shared/response/schedule.response';
import { ShiftDataResponse } from '../../../../shared/response/shift.response';

@Injectable()
export class ScheduleConfigurationService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public shiftConfigurationService: ShiftConfigurationService;
  @Inject() public tableHandlerService: TableHandlerService;

  async getEmployeeRegularShift(
    employeeAccountId: string,
    date: Date,
    raw = true,
  ): Promise<ShiftDataResponse> {
    const getDayOfWeek = this.utilityService.getDayOfWeek(date);
    const employeeInformation: EmployeeData =
      await this.prisma.employeeData.findUnique({
        where: { accountId: employeeAccountId },
      });
    const scheduleInformation: Schedule = await this.prisma.schedule.findUnique(
      { where: { id: employeeInformation.scheduleId } },
    );
    const shiftId = scheduleInformation[`${getDayOfWeek.toLowerCase()}ShiftId`];
    const shiftInformation = await this.shiftConfigurationService.getShiftInfo(
      shiftId,
      raw,
    );
    return shiftInformation;
  }
  async getScheduleList() {
    const schedules = await this.prisma.schedule.findMany({
      where: {
        isDeleted: false,
        companyId: this.utilityService.companyId,
      },
      select: {
        id: true,
        scheduleCode: true,
      },
    });

    // Sort case-insensitively in JavaScript
    return schedules
      .map(schedule => ({
        label: schedule.scheduleCode,
        value: schedule.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  }

  async getScheduleInfo(query: GetScheduleDTO): Promise<ScheduleDataResponse> {
    const scheduleInformation: Schedule = await this.prisma.schedule.findUnique(
      {
        where: {
          id: Number(query.id),
        },
      },
    );

    return await this.formattedScheduleDataResponse(scheduleInformation);
  }

  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'schedule');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      ...tableQuery['where'],
      isDeleted: false,
      companyId: this.utilityService.companyId,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.schedule,
      query,
      tableQuery,
    );
    const formattedList: ScheduleDataResponse[] = await Promise.all(
      baseList.map(async (schedule: Schedule) => {
        return await this.formattedScheduleDataResponse(schedule);
      }),
    );

    return { list: formattedList, pagination, currentPage };
  }

  async create(params: ScheduleUpdateDTO) {
    // Check for duplicate scheduleCode among active schedules only
    const whereClause: any = {
      scheduleCode: params.scheduleCode,
      companyId: this.utilityService.companyId,
      isDeleted: false,
    };

    if (params.id) {
      whereClause.NOT = { id: params.id };
    }

    const existingSchedule = await this.prisma.schedule.findFirst({
      where: whereClause,
    });

    if (existingSchedule) {
      throw new BadRequestException(
        'Schedule with this Schedule Code already exists',
      );
    }

    const scheduleInsert: Prisma.ScheduleCreateInput = {
      scheduleCode: params.scheduleCode,
      mondayShift: { connect: { id: params.daySchedule.mondayShiftId } },
      tuesdayShift: { connect: { id: params.daySchedule.tuesdayShiftId } },
      wednesdayShift: { connect: { id: params.daySchedule.wednesdayShiftId } },
      thursdayShift: { connect: { id: params.daySchedule.thursdayShiftId } },
      fridayShift: { connect: { id: params.daySchedule.fridayShiftId } },
      saturdayShift: { connect: { id: params.daySchedule.saturdayShiftId } },
      sundayShift: { connect: { id: params.daySchedule.sundayShiftId } },
      company: { connect: { id: this.utilityService.companyId } },
    };

    let response;

    if (params.id) {
      response = await this.prisma.schedule.update({
        where: {
          id: params.id,
        },
        data: scheduleInsert,
      });
    } else {
      response = await this.prisma.schedule.create({
        data: scheduleInsert,
      });
    }

    const formattedSchedule =
      await this.formattedScheduleDataResponse(response);
    return formattedSchedule;
  }

  async formattedScheduleDataResponse(
    schedule: Schedule,
  ): Promise<ScheduleDataResponse> {
    const mondayShift = await this.shiftConfigurationService.getShiftInfo(
      schedule.mondayShiftId,
    );
    const tuesdayShift = await this.shiftConfigurationService.getShiftInfo(
      schedule.tuesdayShiftId,
    );
    const wednesdayShift = await this.shiftConfigurationService.getShiftInfo(
      schedule.wednesdayShiftId,
    );
    const thursdayShift = await this.shiftConfigurationService.getShiftInfo(
      schedule.thursdayShiftId,
    );
    const fridayShift = await this.shiftConfigurationService.getShiftInfo(
      schedule.fridayShiftId,
    );
    const saturdayShift = await this.shiftConfigurationService.getShiftInfo(
      schedule.saturdayShiftId,
    );
    const sundayShift = await this.shiftConfigurationService.getShiftInfo(
      schedule.sundayShiftId,
    );
    const totalWorkingHours = await this.calculateTotalWorkingHours(schedule);

    return {
      id: schedule.id,
      scheduleCode: schedule.scheduleCode,
      totalWorkingHours,
      daySchedule: {
        mondayShiftId: schedule.mondayShiftId,
        tuesdayShiftId: schedule.tuesdayShiftId,
        wednesdayShiftId: schedule.wednesdayShiftId,
        thursdayShiftId: schedule.thursdayShiftId,
        fridayShiftId: schedule.fridayShiftId,
        saturdayShiftId: schedule.saturdayShiftId,
        sundayShiftId: schedule.sundayShiftId,
      },
      dayScheduleDetails: {
        mondayShift,
        tuesdayShift,
        wednesdayShift,
        thursdayShift,
        fridayShift,
        saturdayShift,
        sundayShift,
      },
    };
  }

  async deleteSchedule(id: number) {
    id = Number(id);

    if (!id) {
      throw new BadRequestException('Invalid ID.');
    }

    const schedule = await this.prisma.schedule.findUnique({
      where: { id: id },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found.');
    }

    const hasEmployee = await this.prisma.employeeData.findFirst({
      where: {
        scheduleId: id,
      },
    });

    if (hasEmployee) {
      throw new BadRequestException(
        'Cannot delete schedule. Schedule is being used by employee.',
      );
    }

    return await this.prisma.schedule.update({
      where: { id: id },
      data: {
        isDeleted: true,
      },
    });
  }

  async calculateTotalWorkingHours(schedule: Schedule): Promise<HoursFormat> {
    const mondayShift = await this.shiftConfigurationService.getShiftInfo(
      schedule.mondayShiftId,
    );
    const tuesdayShift = await this.shiftConfigurationService.getShiftInfo(
      schedule.tuesdayShiftId,
    );
    const wednesdayShift = await this.shiftConfigurationService.getShiftInfo(
      schedule.wednesdayShiftId,
    );
    const thursdayShift = await this.shiftConfigurationService.getShiftInfo(
      schedule.thursdayShiftId,
    );
    const fridayShift = await this.shiftConfigurationService.getShiftInfo(
      schedule.fridayShiftId,
    );
    const saturdayShift = await this.shiftConfigurationService.getShiftInfo(
      schedule.saturdayShiftId,
    );
    const sundayShift = await this.shiftConfigurationService.getShiftInfo(
      schedule.sundayShiftId,
    );

    const totalWorkingHours = {
      totalHours: 0,
      totalMinutes: 0,
    };

    totalWorkingHours.totalHours += mondayShift.targetHours.raw;
    totalWorkingHours.totalHours += tuesdayShift.targetHours.raw;
    totalWorkingHours.totalHours += wednesdayShift.targetHours.raw;
    totalWorkingHours.totalHours += thursdayShift.targetHours.raw;
    totalWorkingHours.totalHours += fridayShift.targetHours.raw;
    totalWorkingHours.totalHours += saturdayShift.targetHours.raw;
    totalWorkingHours.totalHours += sundayShift.targetHours.raw;

    return this.utilityService.formatHours(totalWorkingHours.totalHours);
  }
}
