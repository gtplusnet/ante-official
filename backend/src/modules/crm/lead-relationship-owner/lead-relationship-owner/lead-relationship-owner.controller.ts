import {
  Controller,
  Body,
  Inject,
  Post,
  Response as NestResponse,
  Query,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { LeadRelationshipOwnerService } from './lead-relationship-owner.service';
import { UtilityService } from '@common/utility.service';
import { CreateMultipleOwnersDto } from './lead-relationship-owner.validator.dto';

@Controller('lead-relationship-owner')
export class LeadRelationshipOwnerController {
  @Inject() private service: LeadRelationshipOwnerService;
  @Inject() private utilityService: UtilityService;

  // Upsert multiple owners
  @Post('multiple')
  async upsertMultiple(
    @Body() dto: CreateMultipleOwnersDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.service.upsertMultiple(dto.accountIds),
      response,
    );
  }

  // Get list of owners
  @Get('list')
  async getList(@Query() query: any, @NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.service.getLeadRelationshipOwnersList(query),
      response,
    );
  }

  // Archive owner
  @Patch(':id/archive')
  async archive(@Param('id') id: string, @NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.service.archiveOwner(parseInt(id)),
      response,
    );
  }

  // Toggle archive status
  @Patch(':id/toggle-archive')
  async toggleArchive(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.service.toggleArchive(parseInt(id)),
      response,
    );
  }
}
