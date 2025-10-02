import { PrismaService } from '@common/prisma.service';

export interface SeederMetadata {
  totalRecords?: number;
  processedRecords?: number;
  skippedRecords?: number;
  errors?: string[];
  [key: string]: any;
}

export abstract class BaseSeeder {
  protected prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  abstract get type(): string;
  abstract get name(): string;
  abstract get description(): string;

  /**
   * Check if this seeder can run for the given company
   * Returns true if seeding is possible, false if data already exists
   */
  abstract canSeed(companyId: number): Promise<boolean>;

  /**
   * Execute the seeding operation
   * Returns metadata about the seeding process
   */
  abstract seed(companyId: number): Promise<SeederMetadata>;

  /**
   * Validate that the seeding was successful
   */
  abstract validate(companyId: number): Promise<boolean>;

  /**
   * Get the current status of this seeder for a company
   */
  async getStatus(companyId: number): Promise<{
    canSeed: boolean;
    isValid: boolean;
    metadata?: any;
  }> {
    const canSeed = await this.canSeed(companyId);
    const isValid = await this.validate(companyId);

    return {
      canSeed,
      isValid,
    };
  }
}
