import { Injectable, Inject } from '@nestjs/common';
import { ExternalFetchService } from '@integrations/external-fetch/external-fetch/external-fetch.service';
import { readFile } from 'fs/promises';
import { PhilhealthConfigurationReponse } from '../../../../shared/response/philhealth-configuration.response';
import { GetPhilhealthBracketDTO } from './philhealth-configuration.interface';
import { UtilityService } from '@common/utility.service';

@Injectable()
export class PhilhealtConfigurationService {
  @Inject() public externalFetchService: ExternalFetchService;
  @Inject() public utility: UtilityService;

  async getPhilhealthTable() {
    const data: PhilhealthConfigurationReponse[] = await JSON.parse(
      await readFile(`src/shared/reference/philhealth/dates.json`, 'utf8'),
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
            `src/shared/reference/philhealth/${configFileName}`,
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
  async getPhilhealthBracket(params: GetPhilhealthBracketDTO) {
    const salary = Number(params.salary);
    const dateBracket = new Date(params.date);

    const data: PhilhealthConfigurationReponse[] =
      await this.getPhilhealthTable();

    /* find date based on date started - there is no date end */
    let dateBracketData = data.find((item) => {
      const dateStart = new Date(item.dateStart);
      return dateBracket >= dateStart;
    });

    if (!dateBracketData) {
      dateBracketData = data[data.length - 1];
    }

    let computation = salary * (dateBracketData.percentage / 100);

    if (computation < dateBracketData.minimumContribution) {
      computation = dateBracketData.minimumContribution;
    }

    if (computation > dateBracketData.maximumContribution) {
      computation = dateBracketData.maximumContribution;
    }

    const employeeShare = Number(computation.toFixed(2));
    const employerShare = Number(employeeShare.toFixed(2));

    return { salary, dateBracketData, employeeShare, employerShare };
  }
}
