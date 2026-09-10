import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from '../database/entities/delivery.entity';
import { InventoryItem } from '../database/entities/inventory-item.entity';
import { ReturnRequest } from '../database/entities/return-request.entity';
import { StockMovement } from '../database/entities/stock-movement.entity';
import { Product } from '../database/entities/product.entity';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, StockMovement, Delivery, ReturnRequest, Product]), AuthModule],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}
