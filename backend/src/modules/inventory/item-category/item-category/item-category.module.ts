import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { ItemCategoryController } from './item-category.controller';
import { ItemCategoryService } from './item-category.service';

@Module({
  imports: [CommonModule],
  controllers: [ItemCategoryController],
  providers: [ItemCategoryService],
  exports: [ItemCategoryService],
})
export class ItemCategoryModule {}
