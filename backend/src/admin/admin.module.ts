import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../database/entities/product.entity';
import { Order } from '../database/entities/order.entity';
import { Customer } from '../database/entities/customer.entity';
import { Delivery } from '../database/entities/delivery.entity';
import { ReturnRequest } from '../database/entities/return-request.entity';
import { PlatformRecord } from '../database/entities/platform-record.entity';
import { InventoryItem } from '../database/entities/inventory-item.entity';
import { StockMovement } from '../database/entities/stock-movement.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [AuthModule, OrdersModule, TypeOrmModule.forFeature([Product,Order,Customer,Delivery,ReturnRequest,PlatformRecord,InventoryItem,StockMovement])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
