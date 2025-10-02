import { Inject, Injectable } from '@nestjs/common';
import {
  HolidayConfigData,
  HolidayConfigList,
  NationalHolidayReference,
  NationHolidayListDTO,
} from './national-holiday-configuration.interface';
import { ExternalFetchService } from '@integrations/external-fetch/external-fetch/external-fetch.service';
import { UtilityService } from '@common/utility.service';
import { readFile } from 'fs/promises';
import { NationalHolidayResponse } from '../../../../shared/response';
import HolidayTypeReference from '../../../../reference/holiday-type.reference';

@Injectable()
export class NationalHolidayConfigurationService {
  @Inject() public externalFetchService: ExternalFetchService;
  @Inject() public utilityService: UtilityService;

  async list(params: NationHolidayListDTO): Promise<HolidayConfigData[]> {
    const list: HolidayConfigData[] = JSON.parse(
      await readFile(
        `src/shared/reference/national-holiday/${params.year}.json`,
        'utf8',
      ),
    );
    return list;
  }

  async formattedList(params: NationHolidayListDTO) {
    const list: HolidayConfigData[] = await this.list(params);
    return Promise.all(list.map((holiday) => this.formatResponse(holiday)));
  }

  async selectDate() {
    const data: HolidayConfigList[] = JSON.parse(
      await readFile(
        'src/shared/reference/national-holiday/dates.json',
        'utf8',
      ),
    );
    data.sort((a, b) => Number(b.year) - Number(a.year));
    return data;
  }
  async getNationalHolidayListByDate(params: {
    date: Date;
  }): Promise<NationalHolidayResponse[]> {
    const year = params.date.getFullYear();
    const list = await this.list({ year });
    const dateFormatted = this.utilityService.formatDate(params.date);
    const nationalHoliday = list.filter(
      (holiday) => holiday.date === dateFormatted.dateStandard,
    );
    return Promise.all(
      nationalHoliday.map((holiday) => this.formatResponse(holiday)),
    );
  }

  formatResponse(data: NationalHolidayReference): NationalHolidayResponse {
    return {
      name: data.name,
      type: HolidayTypeReference.find((item) => item.key === data.type),
      date: this.utilityService.formatDate(data.date),
    };
  }
}
