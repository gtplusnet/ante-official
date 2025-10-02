import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('CLI');

  try {
    await CommandFactory.run(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
  } catch (error) {
    logger.error('CLI execution failed:', error);
    process.exit(1);
  }
}

bootstrap();
