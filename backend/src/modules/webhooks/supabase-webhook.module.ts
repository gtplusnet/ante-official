import { Module } from '@nestjs/common';
import { SupabaseWebhookController } from './supabase-webhook.controller';
import { PrismaService } from '@common/prisma.service';
import { NotificationModule } from '@modules/communication/notification/notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [SupabaseWebhookController],
  providers: [PrismaService],
})
export class SupabaseWebhookModule {}