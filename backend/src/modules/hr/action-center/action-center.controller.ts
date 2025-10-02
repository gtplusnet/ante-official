import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Inject,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ActionCenterService } from './action-center.service';
import {
  ActionCenterIgnoreDTO,
  ActionCenterResolveDTO,
} from './action-center.interface';
import { UtilityService } from '@common/utility.service';

@Controller('hr/action-center')
export class ActionCenterController {
  constructor(
    @Inject() private readonly actionCenterService: ActionCenterService,
    @Inject() private readonly utilityService: UtilityService,
  ) {}

  @Get('items')
  async getItems(@Query() query: any, @Res() response: Response) {
    const page = parseInt(query.page?.toString() || '1', 10);
    const limit = parseInt(query.limit?.toString() || '50', 10);

    const filters = {
      checkType: query.checkType,
      priority: query.priority
        ? parseInt(query.priority.toString(), 10)
        : undefined,
      isIgnored:
        query.isIgnored === 'true'
          ? true
          : query.isIgnored === 'false'
            ? false
            : undefined,
      resolved:
        query.resolved === 'true'
          ? true
          : query.resolved === 'false'
            ? false
            : undefined,
      search: query.search,
    };

    return this.utilityService.responseHandler(
      this.actionCenterService.getItems(page, limit, filters),
      response,
    );
  }

  @Get('stats')
  async getStats(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.actionCenterService.getStats(),
      response,
    );
  }

  @Post('items/:id/ignore')
  async ignoreItem(
    @Param('id') id: string,
    @Body() body: ActionCenterIgnoreDTO,
    @Res() response: Response,
  ) {
    const accountId =
      body.accountId || this.utilityService.accountInformation?.id;
    return this.utilityService.responseHandler(
      this.actionCenterService.ignoreItem(id, accountId),
      response,
    );
  }

  @Post('items/:id/resolve')
  async resolveItem(
    @Param('id') id: string,
    @Body() body: ActionCenterResolveDTO,
    @Res() response: Response,
  ) {
    const accountId =
      body.accountId || this.utilityService.accountInformation?.id;
    return this.utilityService.responseHandler(
      this.actionCenterService.resolveItem(id, accountId, body.notes),
      response,
    );
  }
}
