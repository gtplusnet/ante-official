import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  GetTaxBracketDTO,
  TaxSelectDateDTO,
  TaxTableDTO,
} from './tax-configuration.interface';
import { ExternalFetchService } from '@integrations/external-fetch/external-fetch/external-fetch.service';
import {
  TaxBracketResponse,
  TaxConfigDataResponse,
} from '../../../../shared/response';
import { readFile } from 'fs/promises';

@Injectable()
export class TaxConfigurationService {
  @Inject() public externalFetchService: ExternalFetchService;

  async getFormattedTaxData() {
    let data: TaxConfigDataResponse[] = JSON.parse(
      await readFile(`src/shared/reference/tax/dates.json`, 'utf8'),
    );

    data = await Promise.all(
      data.map(async (item) => {
        item.DAILY = JSON.parse(
          await readFile(
            `src/shared/reference/tax/${item.dateStart}/DAILY.json`,
            'utf8',
          ),
        );
        item.WEEKLY = JSON.parse(
          await readFile(
            `src/shared/reference/tax/${item.dateStart}/WEEKLY.json`,
            'utf8',
          ),
        );
        item.SEMIMONTHLY = JSON.parse(
          await readFile(
            `src/shared/reference/tax/${item.dateStart}/SEMIMONTHLY.json`,
            'utf8',
          ),
        );
        item.MONTHLY = JSON.parse(
          await readFile(
            `src/shared/reference/tax/${item.dateStart}/MONTHLY.json`,
            'utf8',
          ),
        );

        return item;
      }),
    );

    // add data for dateStartRaw
    data.forEach((item) => {
      item.dateStartRaw = new Date(item.dateStart);
    });

    // sort descending by dateStartRaw
    data.sort((a, b) => {
      return b.dateStartRaw.getTime() - a.dateStartRaw.getTime();
    });

    // check if retrieved data matched the TaxData interface
    if (
      data.some(
        (item) =>
          !(
            'dateStart' in item &&
            'label' in item &&
            'DAILY' in item &&
            'WEEKLY' in item &&
            'SEMIMONTHLY' in item &&
            'MONTHLY' in item
          ),
      )
    ) {
      throw new BadRequestException('Data does not match TaxData interface.');
    }

    return data;
  }

  async selectDate() {
    const data: TaxConfigDataResponse[] = await this.getFormattedTaxData();

    const formattedResponse = data.map((item) => {
      return {
        key: item.dateStart,
        label: item.label,
        computationType: item.computationType,
      };
    });

    return formattedResponse;
  }

  async taxTable(params: TaxTableDTO) {
    const filteredData = await this.consolidatedTable({
      date: params.date,
    });

    if (!filteredData) {
      throw new BadRequestException('No tax data found for the given date.');
    }

    if (!filteredData.hasOwnProperty(params.type)) {
      throw new BadRequestException(
        `No tax data found for type: ${params.type}`,
      );
    }

    // sort by min
    filteredData[params.type].sort((a, b) => {
      return a.min - b.min;
    });

    return filteredData[params.type];
  }

  async consolidatedTable(params: TaxSelectDateDTO) {
    const data: TaxConfigDataResponse[] = await this.getFormattedTaxData();
    const dateFilter = new Date(params.date);

    // filter data by date
    const filteredData = data.filter((item) => {
      return item.dateStartRaw <= dateFilter;
    });

    if (filteredData.length === 0) {
      throw new BadRequestException('No tax data found for the given date.');
    }

    return filteredData[0];
  }

  async taxBracket(params: GetTaxBracketDTO): Promise<TaxBracketResponse> {
    params.taxableIncome = Number(params.taxableIncome);

    if (params.taxableIncome < 0) {
      params.taxableIncome = 0;
    }

    const taxTable = await this.taxTable({
      date: params.date,
      type: params.type,
    });

    // get based on range
    let taxBracket = taxTable.find((item) => {
      return (
        params.taxableIncome >= item.min && params.taxableIncome <= item.max
      );
    });

    if (!taxBracket) {
      taxBracket = taxTable[taxTable.length - 1];
    }

    const taxOffset = params.taxableIncome - taxBracket.min;
    const taxByPercentage =
      Math.round(taxOffset * (taxBracket.percentage / 100) * 100) / 100;
    const taxFix = taxBracket.tax;
    const taxTotal = Math.round((taxByPercentage + taxFix) * 100) / 100;

    const taxBracketResponse: TaxBracketResponse = {
      bracket: taxBracket,
      taxOffset,
      taxFix,
      taxByPercentage,
      taxTotal,
    };

    return taxBracketResponse;
  }
}
