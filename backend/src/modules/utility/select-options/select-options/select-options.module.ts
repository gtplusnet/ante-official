import { Module } from '@nestjs/common';
import { SelectOptionsController } from './select-options.controller';

@Module({
  controllers: [SelectOptionsController],
  exports: [],
})
export class SelectOptionsModule {}
