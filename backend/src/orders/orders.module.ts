import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { Product } from '../database/entities/product.entity';
import { InventoryItem } from '../database/entities/inventory-item.entity';
import { StockMovement } from '../database/entities/stock-movement.entity';
import { Customer } from '../database/entities/customer.entity';
import { ReturnRequest } from '../database/entities/return-request.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product, InventoryItem, StockMovement, Customer, ReturnRequest]), AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
