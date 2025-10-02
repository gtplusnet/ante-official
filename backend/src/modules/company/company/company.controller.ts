import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Res,
  NotFoundException,
  Post,
  Delete,
  Query,
  Put,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UtilityService } from '@common/utility.service';
import {
  CompanyCreateDTO,
  CompanyWithInitialUserDTO,
} from './company.validator';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { PrismaService } from '@common/prisma.service';
import { MulterFile } from '../../../types/multer';

@Controller('company')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly utilityService: UtilityService,
    private readonly tableHandler: TableHandlerService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getCurrentCompany(@Res() response: Response) {
    const companyId = this.utilityService.companyId;
    if (!companyId) {
      throw new NotFoundException('Company ID not found in session');
    }

    const company = await this.companyService.getInformation(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.utilityService.responseHandler(
      Promise.resolve(company),
      response,
    );
  }

  @Patch()
  async updateCompany(
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Res() response: Response,
  ) {
    const companyId = this.utilityService.companyId;
    if (!companyId) {
      throw new NotFoundException('Company ID not found in session');
    }

    const result = await this.companyService.updateCompany(
      companyId,
      updateCompanyDto,
    );
    return this.utilityService.responseHandler(
      Promise.resolve(result),
      response,
    );
  }

  @Get('companies')
  async getAllCompanies(@Res() response: Response) {
    const companies = await this.companyService.getAllCompanies();
    return this.utilityService.responseHandler(
      Promise.resolve(companies),
      response,
    );
  }

  @Post('companies')
  async createCompany(
    @Body() createCompanyDto: CompanyCreateDTO,
    @Res() response: Response,
  ) {
    const result = await this.companyService.createCompany(createCompanyDto);
    return this.utilityService.responseHandler(
      Promise.resolve(result),
      response,
    );
  }

  @Post('companies/with-initial-user')
  async createCompanyWithInitialUser(
    @Body() dto: CompanyWithInitialUserDTO,
    @Res() response: Response,
  ) {
    const result = await this.companyService.createCompanyWithInitialUser(dto);
    return this.utilityService.responseHandler(
      Promise.resolve(result),
      response,
    );
  }

  @Delete('companies/:id')
  async deleteCompany(@Param('id') id: number, @Res() response: Response) {
    const result = await this.companyService.deleteCompany(id);
    return this.utilityService.responseHandler(
      Promise.resolve(result),
      response,
    );
  }

  @Put('companies/table')
  async getCompaniesTable(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    const result = await this.companyService.getCompaniesTable(query, body);
    return this.utilityService.responseHandler(
      Promise.resolve(result),
      response,
    );
  }

  @Patch('companies/:id')
  async updateCompanyById(
    @Param('id') id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Res() response: Response,
  ) {
    const result = await this.companyService.updateCompany(
      Number(id),
      updateCompanyDto,
    );
    return this.utilityService.responseHandler(
      Promise.resolve(result),
      response,
    );
  }

  @Put(':id/status')
  async updateCompanyStatus(
    @Param('id') id: number,
    @Body() body: { isActive: boolean },
    @Res() response: Response,
  ) {
    const result = await this.companyService.updateCompanyStatus(
      Number(id),
      body.isActive,
    );
    return this.utilityService.responseHandler(
      Promise.resolve(result),
      response,
    );
  }

  @Post('upload-logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCompanyLogo(
    @UploadedFile() file: MulterFile,
    @Res() response: Response,
  ) {
    const companyId = this.utilityService.companyId;
    if (!companyId) {
      throw new NotFoundException('Company ID not found in session');
    }

    if (!file) {
      throw new NotFoundException('No file provided');
    }

    const result = await this.companyService.uploadLogo(companyId, file);
    return this.utilityService.responseHandler(
      Promise.resolve(result),
      response,
    );
  }
}
