import { Module } from '@nestjs/common';
import { SeederController } from './controllers/seeder.controller';
import { SeederOrchestratorService } from './services/seeder-orchestrator.service';
import { CompanySeederService } from './services/company-seeder.service';
import { SeedTrackingService } from './services/seed-tracking.service';
import { RolesUserLevelsSeeder } from './seeders/roles-user-levels.seeder';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [SeederController],
  providers: [
    SeederOrchestratorService,
    CompanySeederService,
    SeedTrackingService,
    RolesUserLevelsSeeder,
  ],
  exports: [SeederOrchestratorService, SeedTrackingService],
})
export class SeederModule {}
