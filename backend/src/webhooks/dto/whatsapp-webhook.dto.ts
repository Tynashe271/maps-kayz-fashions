import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

// Minimal inbound-message shape for a WhatsApp Business Platform webhook
// (see the "Level 2" integration notes) — enough to match a conversation to
// an order and update its whatsappStatus, without needing the full Cloud API
// payload structure wired up yet.
export class WhatsAppWebhookDto {
  @ApiProperty({ required: false, example: 'MK-1757412345678-0001', description: 'Supplied directly when known; otherwise extracted from `text`.' })
  @IsOptional() @IsString()
  orderNumber?: string;

  @ApiProperty({ required: false, example: '+263771234567' })
  @IsOptional() @IsString()
  from?: string;

  @ApiProperty({ required: false, example: 'Order number: MK-1757412345678-0001 — please confirm my order.' })
  @IsOptional() @IsString()
  text?: string;

  @ApiProperty({ enum: ['inbound', 'outbound'], default: 'inbound' })
  @IsOptional() @IsIn(['inbound', 'outbound'])
  direction?: 'inbound' | 'outbound';
}
