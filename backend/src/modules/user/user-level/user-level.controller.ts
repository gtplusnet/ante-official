import {
  Controller,
  Body,
  Inject,
  Post,
  Response as NestResponse,
  Param,
  Query,
  Put,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';
import { UserLevelService } from './user-level.service';
import {
  CreateUserLevelRequest,
  UpdateUserLevelRequest,
} from '../../../shared/request/user-level.request';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { TableResponse } from '../../../shared/response/table.response';
import { UtilityService } from '@common/utility.service';
import { Response } from 'express';
import { UserLevelDataResponse } from '../../../shared/response/user-level.response';

@Controller('user-level')
export class UserLevelController {
  @Inject() public userLevelService: UserLevelService;
  @Inject() public utilityService: UtilityService;

  @Post('reset-default')
  async resetDefault(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.userLevelService.resetDefault(),
      response,
    );
  }

  @Post('reset-default-with-otp')
  async resetDefaultWithOTP(
    @NestResponse() response: Response,
    @Body() body: { otp: string },
  ) {
    return this.utilityService.responseHandler(
      this.userLevelService.resetDefaultWithOTP(body.otp),
      response,
    );
  }

  @Post()
  async add(
    @NestResponse() response: Response,
    @Body() data: CreateUserLevelRequest,
  ) {
    return this.utilityService.responseHandler(
      this.userLevelService.add(data),
      response,
    );
  }

  @Put('table')
  async table(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ): Promise<TableResponse<UserLevelDataResponse>> {
    return this.utilityService.responseHandler(
      this.userLevelService.table(query, body),
      response,
    );
  }

  @Patch(':id')
  async edit(
    @NestResponse() response: Response,
    @Param('id') id: number,
    @Body() data: UpdateUserLevelRequest,
  ) {
    return this.utilityService.responseHandler(
      this.userLevelService.edit(Number(id), data),
      response,
    );
  }

  @Delete(':id')
  async delete(@NestResponse() response: Response, @Param('id') id: number) {
    return this.utilityService.responseHandler(
      this.userLevelService.delete(Number(id)),
      response,
    );
  }

  @Get('info')
  async info(@NestResponse() response: Response, @Query('id') id: number) {
    return this.utilityService.responseHandler(
      this.userLevelService.info(Number(id)),
      response,
    );
  }

  @Get('tree')
  async tree(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.userLevelService.tree(),
      response,
    );
  }

  @Post('request-reset-otp')
  async requestResetUserLevelOTP(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.userLevelService.requestResetUserLevelOTP(),
      response,
    );
  }

  // ===== DEFAULT USER LEVELS (companyId: null) =====
  @Get('default/list')
  async getDefaultList(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.userLevelService.getDefaultList(),
      response,
    );
  }

  @Post('default')
  async addDefault(
    @NestResponse() response: Response,
    @Body() data: CreateUserLevelRequest,
  ) {
    return this.utilityService.responseHandler(
      this.userLevelService.addDefault(data),
      response,
    );
  }

  @Patch('default/:id')
  async editDefault(
    @NestResponse() response: Response,
    @Param('id') id: number,
    @Body() data: UpdateUserLevelRequest,
  ) {
    return this.utilityService.responseHandler(
      this.userLevelService.editDefault(Number(id), data),
      response,
    );
  }

  @Delete('default/:id')
  async deleteDefault(
    @NestResponse() response: Response,
    @Param('id') id: number,
  ) {
    return this.utilityService.responseHandler(
      this.userLevelService.deleteDefault(Number(id)),
      response,
    );
  }

  @Put('default/table')
  async tableDefault(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    return this.utilityService.responseHandler(
      this.userLevelService.tableDefault(query, body),
      response,
    );
  }

  // ===== DEFAULT USER LEVELS RESET WITH OTP =====
  @Post('default/request-reset-otp')
  async requestResetDefaultUserLevelOTP(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.userLevelService.requestResetDefaultUserLevelOTP(),
      response,
    );
  }

  @Post('default/reset-default-with-otp')
  async resetDefaultWithOTPDefault(
    @NestResponse() response: Response,
    @Body() body: { otp: string },
  ) {
    return this.utilityService.responseHandler(
      this.userLevelService.resetDefaultWithOTPDefault(body.otp),
      response,
    );
  }

  @Get('default/tree')
  async treeDefault(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.userLevelService.treeDefault(),
      response,
    );
  }
}
