import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SeederOrchestratorService } from './seeder-orchestrator.service';
import { UtilityService } from '@common/utility.service';

@Injectable()
export class CompanySeederService {
  @Inject() private seederOrchestrator: SeederOrchestratorService;
  @Inject() private utility: UtilityService;

  @OnEvent('company.created')
  async handleCompanyCreated(payload: {
    companyId: number;
    companyName: string;
  }) {
    try {
      this.utility.log(
        `Starting automatic seeding for new company: ${payload.companyName}`,
      );

      // Execute all seeders for the new company
      const results = await this.seederOrchestrator.executeAllPendingSeeders(
        payload.companyId,
      );

      const successCount = results.filter(
        (r) => r.status === 'completed',
      ).length;
      const failureCount = results.filter((r) => r.status === 'failed').length;

      this.utility.log(
        `Seeding completed for company ${payload.companyName}: ${successCount} successful, ${failureCount} failed`,
      );
    } catch (error) {
      this.utility.log(
        `[ERROR] Failed to seed new company ${payload.companyName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
