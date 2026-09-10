import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

// Shape a payment provider (Paynow, EcoCash, a card gateway) posts back once
// it has verified a transaction. The backend never trusts a customer-side
// "I paid" redirect — only this server-to-server call moves paymentStatus to PAID.
export class PaymentWebhookDto {
  @ApiProperty({ example: 'MK-1757412345678-0001' })
  @IsString()
  orderNumber: string;

  @ApiProperty({ enum: ['paid', 'failed'] })
  @IsIn(['paid', 'failed'])
  status: 'paid' | 'failed';

  @ApiProperty({ required: false, example: 'PN-2409150001' })
  @IsOptional() @IsString()
  reference?: string;
}
