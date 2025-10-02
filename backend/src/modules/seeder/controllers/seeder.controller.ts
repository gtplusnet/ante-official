import {
  Controller,
  Get,
  Post,
  Param,
  Inject,
  Response as NestResponse,
} from '@nestjs/common';
import { Response } from 'express';
import { SeederOrchestratorService } from '../services/seeder-orchestrator.service';
import { UtilityService } from '@common/utility.service';

@Controller('seeder')
export class SeederController {
  @Inject() private seederOrchestrator: SeederOrchestratorService;
  @Inject() private utility: UtilityService;

  @Get('types')
  async getSeederTypes(@NestResponse() response: Response) {
    return this.utility.responseHandler(
      this.seederOrchestrator.getAvailableSeeders(),
      response,
    );
  }

  @Get('status/:companyId')
  async getSeederStatus(
    @Param('companyId') companyId: string,
    @NestResponse() response: Response,
  ) {
    return this.utility.responseHandler(
      this.seederOrchestrator.getSeederStatus(parseInt(companyId)),
      response,
    );
  }

  @Post('execute/:companyId/:seederType')
  async executeSingleSeeder(
    @Param('companyId') companyId: string,
    @Param('seederType') seederType: string,
    @NestResponse() response: Response,
  ) {
    return this.utility.responseHandler(
      this.seederOrchestrator.executeSingleSeeder(
        parseInt(companyId),
        seederType,
      ),
      response,
    );
  }

  @Post('execute-all/:companyId')
  async executeAllSeeders(
    @Param('companyId') companyId: string,
    @NestResponse() response: Response,
  ) {
    return this.utility.responseHandler(
      this.seederOrchestrator.executeAllPendingSeeders(parseInt(companyId)),
      response,
    );
  }
}
