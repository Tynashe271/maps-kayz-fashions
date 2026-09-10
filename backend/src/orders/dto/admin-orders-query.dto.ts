import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus, PaymentStatus, WhatsAppStatus } from '../../database/entities/order.entity';

// Backs GET /admin/orders — lets the admin app's "New Website Orders",
// "WhatsApp Orders", "Awaiting Payment" and "Paid Orders" views filter down
// from the same endpoint instead of each needing its own route.
export class AdminOrdersQueryDto {
  @ApiProperty({ enum: OrderStatus, required: false })
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;

  @ApiProperty({ enum: PaymentStatus, required: false })
  @IsOptional() @IsEnum(PaymentStatus) paymentStatus?: PaymentStatus;

  @ApiProperty({ enum: WhatsAppStatus, required: false })
  @IsOptional() @IsEnum(WhatsAppStatus) whatsappStatus?: WhatsAppStatus;
}
