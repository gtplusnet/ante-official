import { Injectable, Inject } from '@nestjs/common';
import { ExternalFetchService } from '@integrations/external-fetch/external-fetch/external-fetch.service';
import { readFile } from 'fs/promises';
import { PagibigConfigurationReponse } from '../../../../shared/response';
import { GetPagibigBracketDTO } from './pagibig-configuration.interface';
import { UtilityService } from '@common/utility.service';

@Injectable()
export class PagibigConfigurationService {
  @Inject() public externalFetchService: ExternalFetchService;
  @Inject() public utility: UtilityService;

  async getPagibigTable() {
    const data: PagibigConfigurationReponse[] = await JSON.parse(
      await readFile(`src/shared/reference/pagibig/dates.json`, 'utf8'),
    );
    /* sort by dateStart in descending order */
    data.sort((a, b) => {
      const dateA = new Date(a.dateStart);
      const dateB = new Date(b.dateStart);
      return dateB.getTime() - dateA.getTime();
    });

    const allDAta = await Promise.all(
      data.map(async (item) => {
        const configFileName = `${item.dateStart}.json`;
        const detailedConfig = JSON.parse(
          await readFile(
            `src/shared/reference/pagibig/${configFileName}`,
            'utf8',
          ),
        );

        return {
          ...item,
          ...detailedConfig,
        };
      }),
    );

    return allDAta;
  }
  async getPagibigBracket(params: GetPagibigBracketDTO) {
    const dateBracket = new Date(params.date);

    const data: PagibigConfigurationReponse[] = await this.getPagibigTable();

    /* find date based on date started - there is no date end */
    let dateBracketData = data.find((item) => {
      const dateStart = new Date(item.dateStart);
      return dateBracket >= dateStart;
    });

    if (!dateBracketData) {
      dateBracketData = data[data.length - 1];
    }

    // Use fixed maximum values directly (no percentage calculation)
    const employeeShare = dateBracketData.maximumEmployeeShare;
    const employerShare = dateBracketData.maximumEmployerShare;

    dateBracketData.employeeShare = employeeShare;
    dateBracketData.employerShare = employerShare;

    return dateBracketData;
  }
}
