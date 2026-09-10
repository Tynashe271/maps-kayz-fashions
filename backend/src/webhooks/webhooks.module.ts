import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { OrdersModule } from '../orders/orders.module';
import { PlatformRecord } from '../database/entities/platform-record.entity';

@Module({
  imports: [OrdersModule, TypeOrmModule.forFeature([PlatformRecord])],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
