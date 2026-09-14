import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformRecord } from '../database/entities/platform-record.entity';
import { NotificationsService } from './notifications.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

// Global (like sync/sync.module.ts) so operations.module.ts and
// orders.module.ts can both inject NotificationsService without importing
// each other or duplicating its providers.
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PlatformRecord]), WhatsAppModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
