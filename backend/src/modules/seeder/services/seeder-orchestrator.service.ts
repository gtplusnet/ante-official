import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { BaseSeeder } from '../seeders/base.seeder';
import { RolesUserLevelsSeeder } from '../seeders/roles-user-levels.seeder';
import { LiquidationWorkflowSeeder } from '../seeders/liquidation-workflow.seeder';
import { PurchaseRequestWorkflowSeeder } from '../seeders/purchase-request-workflow.seeder';
import { ScheduleShiftSeeder } from '../seeders/schedule-shift.seeder';
import { PayrollGroupSeeder } from '../seeders/payroll-group.seeder';
import { SeedTrackingService } from './seed-tracking.service';
import { UtilityService } from '@common/utility.service';

export interface SeederStatus {
  type: string;
  name: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'manual';
  canSeed: boolean;
  seedDate?: Date;
  errorMessage?: string;
  metadata?: any;
}

@Injectable()
export class SeederOrchestratorService {
  private seeders: Map<string, BaseSeeder> = new Map();

  @Inject() private prisma: PrismaService;
  @Inject() private seedTrackingService: SeedTrackingService;
  @Inject() private utility: UtilityService;

  constructor(
    prisma: PrismaService,
    seedTrackingService: SeedTrackingService,
    utility: UtilityService,
  ) {
    this.prisma = prisma;
    this.seedTrackingService = seedTrackingService;
    this.utility = utility;

    // Register all seeders
    this.registerSeeder(new RolesUserLevelsSeeder(prisma));
    this.registerSeeder(new LiquidationWorkflowSeeder(prisma));
    this.registerSeeder(new PurchaseRequestWorkflowSeeder(prisma));
    this.registerSeeder(new ScheduleShiftSeeder(prisma));
    this.registerSeeder(new PayrollGroupSeeder(prisma));
    // Add more seeders here as they are created
  }

  private registerSeeder(seeder: BaseSeeder) {
    this.seeders.set(seeder.type, seeder);
  }

  async getAvailableSeeders(): Promise<
    Array<{ type: string; name: string; description: string }>
  > {
    return Array.from(this.seeders.values()).map((seeder) => ({
      type: seeder.type,
      name: seeder.name,
      description: seeder.description,
    }));
  }

  async getSeederStatus(companyId: number): Promise<SeederStatus[]> {
    const statuses: SeederStatus[] = [];

    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    for (const [type, seeder] of this.seeders) {
      const tracking = await this.seedTrackingService.getTracking(
        companyId,
        type,
      );
      const canSeed = await seeder.canSeed(companyId);
      const hasData = await seeder.validate(companyId);

      // Determine status
      let status: 'pending' | 'completed' | 'failed' | 'manual' = 'pending';
      if (tracking?.status) {
        status = tracking.status as 'pending' | 'completed' | 'failed';
      } else if (!canSeed && hasData) {
        // Data exists but wasn't seeded through our system
        status = 'manual';
      }

      statuses.push({
        type: seeder.type,
        name: seeder.name,
        description: seeder.description,
        status,
        canSeed,
        seedDate: tracking?.seedDate || undefined,
        errorMessage: tracking?.errorMessage || undefined,
        metadata: tracking?.metadata || undefined,
      });
    }

    return statuses;
  }

  async executeSingleSeeder(
    companyId: number,
    seederType: string,
  ): Promise<SeederStatus> {
    const seeder = this.seeders.get(seederType);
    if (!seeder) {
      throw new NotFoundException(`Seeder type '${seederType}' not found`);
    }

    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if seeding is possible
    const canSeed = await seeder.canSeed(companyId);
    if (!canSeed) {
      throw new BadRequestException(
        `Cannot seed ${seeder.name} - data already exists`,
      );
    }

    try {
      // Execute the seeder
      const metadata = await seeder.seed(companyId);

      // Mark as completed
      await this.seedTrackingService.markAsCompleted(
        companyId,
        seederType,
        metadata,
      );

      // Log success
      this.utility.log(
        `Successfully seeded ${seeder.name} for company ${company.companyName}`,
      );

      return {
        type: seeder.type,
        name: seeder.name,
        description: seeder.description,
        status: 'completed',
        canSeed: false,
        seedDate: new Date(),
        metadata,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      // Mark as failed
      await this.seedTrackingService.markAsFailed(
        companyId,
        seederType,
        errorMessage,
      );

      // Log error
      this.utility.log(
        `[ERROR] Failed to seed ${seeder.name} for company ${company.companyName}: ${errorMessage}`,
      );

      throw error;
    }
  }

  async executeAllPendingSeeders(companyId: number): Promise<SeederStatus[]> {
    const results: SeederStatus[] = [];

    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    for (const [type, seeder] of this.seeders) {
      try {
        const canSeed = await seeder.canSeed(companyId);
        if (canSeed) {
          const result = await this.executeSingleSeeder(companyId, type);
          results.push(result);
        } else {
          // Get existing status
          const tracking = await this.seedTrackingService.getTracking(
            companyId,
            type,
          );
          results.push({
            type: seeder.type,
            name: seeder.name,
            description: seeder.description,
            status:
              (tracking?.status as 'pending' | 'completed' | 'failed') ||
              'completed',
            canSeed: false,
            seedDate: tracking?.seedDate || undefined,
            errorMessage: tracking?.errorMessage || undefined,
            metadata: tracking?.metadata || undefined,
          });
        }
      } catch (error) {
        // Continue with other seeders even if one fails
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        results.push({
          type: seeder.type,
          name: seeder.name,
          description: seeder.description,
          status: 'failed',
          canSeed: true,
          errorMessage,
        });
      }
    }

    return results;
  }
}
