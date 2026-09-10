import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';
import { OrderStatus } from '../../database/entities/order.entity';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
	@IsOptional()
	@IsEnum(OrderStatus)
	status?: OrderStatus;
}
