import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '@common/common.module';

// Mock database connections for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.test',
      isGlobal: true,
    }),

    // Only essential modules to avoid circular dependencies
    CommonModule,
  ],
})
export class TestAppModule {}
