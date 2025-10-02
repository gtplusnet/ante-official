import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { UtilityService } from '@common/utility.service';

export enum URLMapKey {
  pagibig = 'https://raw.githubusercontent.com/gtplusnet/geer-config/main/payroll/pagibig',
  tax = 'https://geer-config.guillermotabligan.com/payroll/tax',
  nationalHoliday = 'https://geer-config.guillermotabligan.com/payroll/national-holiday',
  philhealth = 'https://raw.githubusercontent.com/gtplusnet/geer-config/refs/heads/main/payroll/philhealth/',
  sss = 'https://raw.githubusercontent.com/gtplusnet/geer-config/refs/heads/main/payroll/sss/',
}

@Injectable()
export class ExternalFetchService {
  @Inject() public utilityService: UtilityService;

  async getData(url: URLMapKey, file = ''): Promise<any> {
    const data = await this.fetchData(url + file);
    return data;
  }

  async fetchData(url: string): Promise<any> {
    let response;
    let data;
    let attempts = 0;
    const maxAttempts = 20;

    this.utilityService.log(`Fetching data from external URL.`);

    while (attempts < maxAttempts) {
      try {
        response = await fetch(url);

        if (!response.ok) {
          this.utilityService.log(`HTTP error! status: ${response.status}`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          throw new BadRequestException(
            `HTTP error! status: ${response.status}`,
          );
        }

        this.utilityService.log(`Data fetched successfully.`);
        data = await response.json();

        break; // exit loop if fetch is successful
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          this.utilityService.log(
            `Failed to fetch data after ${maxAttempts} attempts: ${error.message}`,
          );
          throw new BadRequestException(
            `Failed to fetch data after ${maxAttempts} attempts: ${error.message}`,
          );
        }
      }
    }

    return data;
  }
}
