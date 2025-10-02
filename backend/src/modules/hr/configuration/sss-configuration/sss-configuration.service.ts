import { Injectable, Inject } from '@nestjs/common';
import { ExternalFetchService } from '@integrations/external-fetch/external-fetch/external-fetch.service';
import {
  SSSConfigDataResponse,
  SSSDataResponse,
} from '../../../../shared/response';
import { readFile } from 'fs/promises';
import { UtilityService } from '@common/utility.service';
import { GetSSSBracketDTO } from './sss-configuration.interface';
@Injectable()
export class SssConfigurationService {
  @Inject() public externalFetchService: ExternalFetchService;
  @Inject() public utilityService: UtilityService;

  async getSSSConfiguration(
    isDateOnly = false,
  ): Promise<SSSConfigDataResponse[]> {
    const data: SSSConfigDataResponse[] = JSON.parse(
      await readFile(`src/shared/reference/sss/dates.json`, 'utf8'),
    );

    // sort by date descending by dateStart
    data.sort((a, b) => {
      return new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime();
    });

    data.reverse();

    for (const date of data) {
      date.dateStartFormatted = this.utilityService.formatDate(date.dateStart);
      if (!isDateOnly) {
        date.data = JSON.parse(
          await readFile(
            `src/shared/reference/sss/${date.dateStart}.json`,
            'utf8',
          ),
        ) as SSSDataResponse[];
        date.data.map((item, i) => {
          const nextData =
            i < date.data.length - 1
              ? (date.data[i + 1] as SSSDataResponse)
              : null;
          return this.formatSSSData(item as SSSDataResponse, nextData);
        });
      }
    }

    return data;
  }
  async getSSSConfigurationSelectDate(): Promise<SSSConfigDataResponse[]> {
    return (await this.getSSSConfiguration(true)).reverse();
  }
  async getSSSConfigurationByDate(date: string): Promise<SSSDataResponse[]> {
    const dateList = await this.getSSSConfiguration(true);
    let dateStart = dateList
      .reverse()
      .find((item) => item.dateStartFormatted.raw <= new Date(date));

    if (!dateStart) {
      dateStart = dateList[dateList.length - 1];
    }

    const data = JSON.parse(
      await readFile(
        `src/shared/reference/sss/${dateStart.dateStart}.json`,
        'utf8',
      ),
    ) as SSSDataResponse[];
    data.map((item, i) => {
      const nextData =
        i < data.length - 1 ? (data[i + 1] as SSSDataResponse) : null;
      return this.formatSSSData(item as SSSDataResponse, nextData);
    });

    data.sort((a, b) => {
      return a.compensationRange - b.compensationRange;
    });

    return data;
  }

  async formatSSSData(
    data: SSSDataResponse,
    nextData: SSSDataResponse | null,
  ): Promise<SSSDataResponse> {
    if (nextData) {
      data.compensationRangeLabel = `${data.compensationRange} - ${nextData.compensationRange - 0.01}`;
    } else {
      data.compensationRangeLabel = `Above ${data.compensationRange}`;
    }

    data.monthlySalaryCredit.total =
      data.monthlySalaryCredit.regular + data.monthlySalaryCredit.mpf;
    data.contributionAmount.employer.total =
      data.contributionAmount.employer.regular +
      data.contributionAmount.employer.mpf +
      data.contributionAmount.employer.ec;
    data.contributionAmount.employee.total =
      data.contributionAmount.employee.regular +
      data.contributionAmount.employee.mpf;
    data.total =
      data.contributionAmount.employer.total +
      data.contributionAmount.employee.total;

    return data;
  }
  async getSSSConfigurationByDateAndSalary(
    params: GetSSSBracketDTO,
  ): Promise<SSSDataResponse> {
    const SSSListReference: SSSDataResponse[] =
      await this.getSSSConfigurationByDate(params.date);
    const salary = params.salary;

    SSSListReference.reverse();

    const SSSList = SSSListReference.find((item) => {
      return item.compensationRange <= salary;
    });

    if (!SSSList) {
      return SSSListReference[SSSListReference.length - 1];
    }

    return SSSList;
  }
}
