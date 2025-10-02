import {
  Inject,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Body,
  Res,
  Query,
} from '@nestjs/common';
import { DeveloperAccountService } from './developer-account.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import {
  DeveloperAccountGetDTO,
  DeveloperAccountCreateDTO,
  DeveloperAccountUpdateDTO,
  DeveloperAccountDeleteDTO,
} from './developer-account.validator';

@Controller('developer-account')
export class DeveloperAccountController {
  @Inject() public developerAccountService: DeveloperAccountService;
  @Inject() public utility: UtilityService;

  @Get()
  async get(@Res() response, @Query() params: DeveloperAccountGetDTO) {
    return this.utility.responseHandler(
      this.developerAccountService.getDeveloperAccount(params),
      response,
    );
  }

  @Put()
  async table(
    @Res() response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    return this.utility.responseHandler(
      this.developerAccountService.developerAccountTable(query, body),
      response,
    );
  }

  @Post()
  async add(@Res() response, @Body() params: DeveloperAccountCreateDTO) {
    return this.utility.responseHandler(
      this.developerAccountService.createDeveloperAccount(params),
      response,
    );
  }

  @Patch()
  async update(@Res() response, @Body() params: DeveloperAccountUpdateDTO) {
    return this.utility.responseHandler(
      this.developerAccountService.updateDeveloperAccount(params),
      response,
    );
  }

  @Delete()
  async delete(@Res() response, @Query() params: DeveloperAccountDeleteDTO) {
    return this.utility.responseHandler(
      this.developerAccountService.deleteDeveloperAccount(params),
      response,
    );
  }

  @Post('toggle-developer')
  async toggleDeveloper(
    @Res() response,
    @Body() params: { accountId: string },
  ) {
    return this.utility.responseHandler(
      this.developerAccountService.toggleDeveloperStatus(params.accountId),
      response,
    );
  }

  @Get('companies')
  async getCompanies(@Res() response) {
    return this.utility.responseHandler(
      this.developerAccountService.getCompanies(),
      response,
    );
  }

  @Get('roles')
  async getRoles(@Res() response, @Query('companyId') companyId?: string) {
    const parsedCompanyId = companyId ? parseInt(companyId, 10) : undefined;
    return this.utility.responseHandler(
      this.developerAccountService.getRoles(parsedCompanyId),
      response,
    );
  }

  @Post('login-as')
  async loginAs(@Res() response, @Body() params: { targetUserId: string }) {
    // Check if current user is a developer
    const currentAccount = this.utility.accountInformation;
    if (!currentAccount?.isDeveloper) {
      throw new Error('Only developer accounts can use this feature');
    }

    return this.utility.responseHandler(
      this.developerAccountService.loginAsUser(params.targetUserId),
      response,
    );
  }
}
