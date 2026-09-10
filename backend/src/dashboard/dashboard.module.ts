import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformRecord } from '../database/entities/platform-record.entity';
import { Customer } from '../database/entities/customer.entity';
import { Order } from '../database/entities/order.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
@Module({imports:[TypeOrmModule.forFeature([PlatformRecord,Customer,Order])],controllers:[DashboardController],providers:[DashboardService]})
export class DashboardModule {}
