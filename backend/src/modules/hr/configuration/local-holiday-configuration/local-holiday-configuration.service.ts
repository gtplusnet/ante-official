import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import {
  LocalHolidayCreateDTO,
  LocalHolidayEditDTO,
} from './local-holiday-configuration.interface';
import { PrismaService } from '@common/prisma.service';
import { LocalHoliday, Prisma } from '@prisma/client';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { LocalHolidayResponse } from '../../../../shared/response';
import HolidayTypeReference from '../../../../reference/holiday-type.reference';

@Injectable()
export class LocalHolidayConfigurationService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;

  async create(params: LocalHolidayCreateDTO) {
    const createHolidayParams: Prisma.LocalHolidayCreateInput = {
      name: params.name,
      date: new Date(params.date),
      type: params.type,
      province: { connect: { id: params.provinceId } },
      company: { connect: { id: this.utilityService.companyId } },
    };

    const response = await this.prisma.localHoliday.create({
      data: createHolidayParams,
    });
    const formattedResponse = await this.formatLocalHolidayResponse(response);

    return formattedResponse;
  }
  async edit(params: LocalHolidayEditDTO) {
    const holiday = await this.prisma.localHoliday.findUnique({
      where: { id: params.id },
    });

    if (!holiday) {
      throw new NotFoundException(
        `Local Holiday with ID #${params.id} not found.`,
      );
    }

    const updateHolidayParams: Prisma.LocalHolidayUpdateInput = {
      name: params.name,
      date: new Date(params.date),
      type: params.type,
      province: { connect: { id: params.provinceId } },
    };

    const response = await this.prisma.localHoliday.update({
      where: { id: params.id },
      data: updateHolidayParams,
    });
    const formattedResponse = await this.formatLocalHolidayResponse(response);

    return formattedResponse;
  }

  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'localHoliday');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';

    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utilityService.companyId,
    };
    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.localHoliday,
      query,
      tableQuery,
    );
    const formattedList = await Promise.all(
      baseList.map(async (item: LocalHoliday) => {
        const formattedItem = await this.formatResponse(item);
        return formattedItem;
      }),
    );

    return { list: formattedList, pagination, currentPage };
  }

  async delete(params: { id: number }) {
    params.id = Number(params.id);

    const holiday = await this.prisma.localHoliday.findUnique({
      where: { id: params.id },
    });

    if (!holiday) {
      throw new NotFoundException(
        `Local Holiday with ID #${params.id} not found.`,
      );
    }

    const response = await this.prisma.localHoliday.delete({
      where: { id: params.id },
    });
    const formattedResponse = await this.formatLocalHolidayResponse(response);

    return formattedResponse;
  }
  async getLocalHolidayListByDate(params: {
    date: Date;
    companyId?: number; // Optional companyId parameter for background processing
  }): Promise<LocalHolidayResponse[]> {
    const { date, companyId } = params;

    // Use provided companyId, or fallback to CLS context if available
    let targetCompanyId = companyId;
    if (!targetCompanyId) {
      try {
        targetCompanyId = this.utilityService.companyId;
      } catch (error) {
        // CLS context not available - this shouldn't happen for local holidays
        // as they should always have companyId passed in background jobs
        this.utilityService.log(
          `[LOCAL-HOLIDAY] Warning: No companyId available, skipping local holiday check for date: ${date}`,
        );
        return []; // Return empty array instead of throwing error
      }
    }

    const holidayList = await this.prisma.localHoliday.findMany({
      where: {
        date: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        },
        companyId: targetCompanyId,
      },
    });

    const formattedList = await Promise.all(
      holidayList.map(async (item: LocalHoliday) => {
        const formattedItem = await this.formatResponse(item);
        return formattedItem;
      }),
    );

    return formattedList;
  }

  async formatResponse(data: LocalHoliday): Promise<LocalHolidayResponse> {
    const province = await this.prisma.locationProvince.findUnique({
      where: { id: data.provinceId },
      include: { region: true },
    });

    const formattedData: LocalHolidayResponse = {
      id: data.id,
      name: data.name,
      type: HolidayTypeReference.find((item) => item.key === data.type),
      province,
      date: this.utilityService.formatDate(data.date),
    };

    return formattedData;
  }

  /**
   * Formats a local holiday response according to the standard format
   */
  private async formatLocalHolidayResponse(holiday: any): Promise<any> {
    if (!holiday) return null;

    const province = await this.prisma.locationProvince.findUnique({
      where: { id: holiday.provinceId },
      include: { region: true },
    });

    return {
      id: holiday.id,
      name: holiday.name,
      type: HolidayTypeReference.find((item) => item.key === holiday.type) || {
        key: holiday.type,
        label: holiday.type,
      },
      date: this.utilityService.formatDate(holiday.date),
      province: province,
    };
  }
}
