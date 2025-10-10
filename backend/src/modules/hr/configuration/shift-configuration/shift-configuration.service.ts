import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { ShiftUpdateDTO } from './shift-configuration.interface';
import { PrismaService } from '@common/prisma.service';
import { Prisma, Shift, ShiftTime, ShiftPurpose } from '@prisma/client';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import {
  HoursFormat,
  TimeFormat,
} from '../../../../shared/response/utility.format';
import {
  ShiftDataResponse,
  ShiftTimeDataResponse,
} from '../../../../shared/response/shift.response';
import { ShiftType } from '@prisma/client';
import ShiftTypeReference from '../../../../reference/shift-type.reference';

@Injectable()
export class ShiftConfigurationService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;

  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'shift');
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
      this.prisma.shift,
      query,
      tableQuery,
    );
    const formattedList: ShiftDataResponse[] = await Promise.all(
      baseList.map(async (shift: Shift) => {
        return await this.formatShiftData(shift);
      }),
    );

    return { list: formattedList, pagination, currentPage };
  }

  async getShiftList() {
    const shifts = await this.prisma.shift.findMany({
      where: {
        isDeleted: false,
        companyId: this.utilityService.companyId,
        NOT: {
          purpose: ShiftPurpose.EMPLOYEE_ADJUSTMENT, // Exclude EMPLOYEE_ADJUSTMENT shifts
        },
      },
      select: {
        id: true,
        shiftCode: true,
      },
      orderBy: {
        shiftCode: 'asc',
      },
    });

    return shifts.map(shift => ({
      label: shift.shiftCode,
      value: shift.id,
    }));
  }

  async getShiftInfo(id: number, raw = true): Promise<ShiftDataResponse> {
    id = Number(id);
    const shiftInformation: Shift = await this.prisma.shift.findUnique({
      where: { id },
    });

    if (!shiftInformation) {
      throw new NotFoundException('Shift not found');
    }

    const formattedShiftInformation = await this.formatShiftData(
      shiftInformation,
      raw,
    );
    return formattedShiftInformation;
  }

  async getShiftType() {
    return ShiftTypeReference.map((type) => {
      return {
        key: type.key,
        value: type.label,
        label: type.label,
        description: type.label,
      };
    });
  }

  async create(params: ShiftUpdateDTO) {
    // if isFlexiTime is false, then shiftTime should be provided
    if (params.shiftType == ShiftType.TIME_BOUND) {
      if (!params.shiftTime || params.shiftTime.length === 0) {
        throw new BadRequestException('Time Schedule is required');
      }
    } else if (
      params.shiftType == ShiftType.FLEXITIME ||
      params.shiftType == ShiftType.EXTRA_DAY
    ) {
      if (!params.targetHours) {
        throw new BadRequestException('Working Hours should be provided');
      }
    }

    // create shift
    const createShiftParams: Prisma.ShiftCreateInput = {
      shiftCode: params.shiftCode,
      shiftType: params.shiftType,
      breakHours: params.breakHours,
      targetHours: 0,
      company: { connect: { id: this.utilityService.companyId } },
    };

    if (
      params.shiftType == ShiftType.FLEXITIME ||
      params.shiftType == ShiftType.EXTRA_DAY ||
      params.shiftType == ShiftType.REST_DAY
    ) {
      createShiftParams.targetHours = params.targetHours;
    } else {
      createShiftParams.targetHours = 0;
    }

    // check if shiftCode already exists
    if (!params.id) {
      const existingShift = await this.prisma.shift.findFirst({
        where: {
          shiftCode: params.shiftCode,
          companyId: this.utilityService.companyId,
          isDeleted: false,
        },
      });
      if (existingShift) {
        throw new ConflictException(
          'Shift with this Shift Code already exists',
        );
      }
    }

    // create shift time
    const shift = await this.prisma.shift.upsert({
      where: params.id ? { id: params.id } : { id: -1 }, // Use a fallback or handle appropriately
      update: createShiftParams,
      create: createShiftParams,
    });

    if (params.id) {
      await this.prisma.shiftTime.deleteMany({ where: { shiftId: params.id } });
    }
    // record shift time
    // changed await Promise.all to for of loop to preserve the order of the shiftTime
    for (const shiftTime of params.shiftTime) {
      await this.prisma.shiftTime.create({
        data: {
          startTime: shiftTime.startTime,
          endTime: shiftTime.endTime,
          isBreakTime: shiftTime.isBreakTime || false,
          shiftId: shift.id,
        },
      });
    }

    return shift;
  }

  async createAdjustmentShift(params: ShiftUpdateDTO, filingId?: number) {
    // Create shift with EMPLOYEE_ADJUSTMENT purpose and isDeleted: true
    const createShiftParams: Prisma.ShiftCreateInput = {
      shiftCode: params.shiftCode,
      shiftType: params.shiftType,
      breakHours: params.breakHours,
      targetHours: 0,
      purpose: ShiftPurpose.EMPLOYEE_ADJUSTMENT,
      isDeleted: true, // Hide from main shift management
      company: { connect: { id: this.utilityService.companyId } },
    };

    // Add filing relation if provided
    if (filingId) {
      createShiftParams.filing = { connect: { id: filingId } };
    }

    if (
      params.shiftType == ShiftType.FLEXITIME ||
      params.shiftType == ShiftType.EXTRA_DAY ||
      params.shiftType == ShiftType.REST_DAY
    ) {
      createShiftParams.targetHours = params.targetHours;
    }

    // Create the adjustment shift
    const shift = await this.prisma.shift.create({
      data: createShiftParams,
    });

    // Create shift time entries
    for (const shiftTime of params.shiftTime) {
      await this.prisma.shiftTime.create({
        data: {
          startTime: shiftTime.startTime,
          endTime: shiftTime.endTime,
          isBreakTime: shiftTime.isBreakTime || false,
          shiftId: shift.id,
        },
      });
    }

    return shift;
  }

  async formatShiftData(shift: Shift, raw = true): Promise<ShiftDataResponse> {
    const shiftTime: ShiftTime[] = await this.prisma.shiftTime.findMany({
      where: { shiftId: shift.id },
    });
    const nextDayShiftTime: ShiftTime[] = [];

    let totalWorkHours = 0;
    let targetHours = 0;
    let shiftBreakHours = 0;

    let startTime: TimeFormat;
    let endTime: TimeFormat;

    shiftTime.forEach((shiftTimeData) => {
      const formatStartTime = this.utilityService.formatTime(
        shiftTimeData.startTime,
      );
      const formatEndTime = this.utilityService.formatTime(
        shiftTimeData.endTime,
      );

      if (formatStartTime.hours > formatEndTime.hours && !raw) {
        const nextDayShiftTimeData = shiftTimeData;

        nextDayShiftTime.push({
          ...nextDayShiftTimeData,
          startTime: '00:00',
          endTime: shiftTimeData.endTime,
        });
        shiftTimeData.endTime = '23:59';
      }
    });

    if (shiftTime.length > 0) {
      startTime = this.utilityService.formatTime(shiftTime[0].startTime);
      endTime = this.utilityService.formatTime(
        shiftTime[shiftTime.length - 1].endTime,
      );
    } else {
      startTime = null;
      endTime = null;
    }

    const parsedFormattedShiftTime: ShiftTimeDataResponse[] = await Promise.all(
      shiftTime.map(async (shiftTimeData) => {
        const formattedShiftTime =
          await this.formatShiftTimeData(shiftTimeData);
        totalWorkHours += !formattedShiftTime.isBreakTime
          ? formattedShiftTime.workHours.raw
          : 0;
        shiftBreakHours += formattedShiftTime.isBreakTime
          ? formattedShiftTime.workHours.raw
          : 0;
        return formattedShiftTime;
      }),
    );

    const parsedFormattedNextDayShiftTime: ShiftTimeDataResponse[] =
      await Promise.all(
        nextDayShiftTime.map(async (shiftTimeData) => {
          const formattedShiftTime =
            await this.formatShiftTimeData(shiftTimeData);
          totalWorkHours += !formattedShiftTime.isBreakTime
            ? formattedShiftTime.workHours.raw
            : 0;
          shiftBreakHours += formattedShiftTime.isBreakTime
            ? formattedShiftTime.workHours.raw
            : 0;
          return formattedShiftTime;
        }),
      );

    if (
      shift.shiftType == ShiftType.FLEXITIME ||
      shift.shiftType == ShiftType.EXTRA_DAY ||
      shift.shiftType == ShiftType.REST_DAY
    ) {
      totalWorkHours = shift.targetHours;
      targetHours = shift.targetHours + shift.breakHours;
    } else {
      totalWorkHours = totalWorkHours - shift.breakHours;
      targetHours = totalWorkHours + shift.breakHours + shiftBreakHours;
    }

    const shiftType = ShiftTypeReference.find(
      (type) => type.key === shift.shiftType,
    );

    const formattedShiftData: ShiftDataResponse = {
      id: shift.id,
      shiftCode: shift.shiftCode,
      breakHours: this.utilityService.formatHours(shift.breakHours),
      targetHours: this.utilityService.formatHours(targetHours),
      totalWorkHours: this.utilityService.formatHours(totalWorkHours),
      shiftBreakHours: this.utilityService.formatHours(shiftBreakHours),
      shiftTime: parsedFormattedShiftTime,
      nextDayShiftTime: parsedFormattedNextDayShiftTime,
      shiftType: shiftType,
      startTime,
      endTime,
    };

    return formattedShiftData;
  }
  async formatShiftTimeData(
    shiftTime: ShiftTime,
  ): Promise<ShiftTimeDataResponse> {
    const startTime = this.utilityService.formatTime(shiftTime.startTime);
    const endTime = this.utilityService.formatTime(shiftTime.endTime);

    const isNightShift = startTime.seconds > endTime.seconds;
    const isBreakTime = shiftTime.isBreakTime;
    let workHours = endTime.hours - startTime.hours;

    if (isNightShift) {
      workHours = 24 - startTime.hours + endTime.hours;
    }

    const formattedWorkHours = this.utilityService.formatHours(
      workHours,
    ) as HoursFormat;

    return {
      isNightShift,
      startTime,
      endTime,
      workHours: formattedWorkHours,
      isBreakTime,
    };
  }
  async deleteShift(id: number) {
    id = Number(id);

    const shiftInformation = await this.prisma.shift.findUnique({
      where: { id },
    });

    if (!shiftInformation) {
      throw new NotFoundException('Shift not found');
    }

    const shiftDelete = await this.prisma.shift.update({
      where: { id },
      data: { isDeleted: true },
    });

    return shiftDelete;
  }
}
