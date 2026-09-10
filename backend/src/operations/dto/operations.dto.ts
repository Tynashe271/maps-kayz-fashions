import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { DeliveryStatus } from '../../database/entities/delivery.entity';
import { ReturnStatus } from '../../database/entities/return-request.entity';
import { StockMovementType } from '../../database/entities/stock-movement.entity';

export class AdjustStockDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsInt()
  quantity: number;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  staffId?: string;
}

export class CreateDeliveryDto {
  @IsString()
  orderId: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateDeliveryDto {
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  courierName?: string;
}

export class CreateReturnDto {
  @IsString()
  orderId: string;

  @IsString()
  customerId: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateReturnDto {
  @IsEnum(ReturnStatus)
  status: ReturnStatus;
}
