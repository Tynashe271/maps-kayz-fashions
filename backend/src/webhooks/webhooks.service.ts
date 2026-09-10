import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from '../orders/orders.service';
import { WhatsAppStatus } from '../database/entities/order.entity';
import { PlatformRecord } from '../database/entities/platform-record.entity';
import { PaymentWebhookDto, WhatsAppWebhookDto } from './dto';

const ORDER_NUMBER_PATTERN = /MK-\d+-\d+/;

@Injectable()
export class WebhooksService {
  constructor(
    private readonly orders: OrdersService,
    @InjectRepository(PlatformRecord) private readonly records: Repository<PlatformRecord>,
  ) {}

  // Both webhook routes are unauthenticated by nature (a payment provider or
  // the WhatsApp Business Platform calls them directly), so a shared secret
  // is the only thing standing between them and the internet. Set
  // PAYMENT_WEBHOOK_SECRET / WHATSAPP_WEBHOOK_SECRET to require it; unset,
  // the check is skipped for local development.
  private verifySecret(provided: string | undefined, envVar: string) {
    const expected = process.env[envVar];
    if (expected && provided !== expected) throw new UnauthorizedException('Invalid webhook signature');
  }

  // POST /webhooks/payment — the backend must verify payment through this
  // provider callback, never by trusting a customer's return to a success page.
  async handlePayment(secret: string | undefined, dto: PaymentWebhookDto) {
    this.verifySecret(secret, 'PAYMENT_WEBHOOK_SECRET');
    if (dto.status === 'paid') return this.orders.verifyPayment(dto.orderNumber, dto.reference);
    return this.orders.markPaymentFailed(dto.orderNumber, dto.reference);
  }

  // POST /webhooks/whatsapp — matches an inbound/outbound message to an order
  // by order number and updates whatsappStatus; anything unmatched is logged
  // to the platform record store for the admin app's "Unmatched Messages" queue.
  async handleWhatsApp(secret: string | undefined, dto: WhatsAppWebhookDto) {
    this.verifySecret(secret, 'WHATSAPP_WEBHOOK_SECRET');
    const orderNumber = dto.orderNumber ?? dto.text?.match(ORDER_NUMBER_PATTERN)?.[0];
    if (orderNumber) {
      try {
        const status = dto.direction === 'outbound' ? WhatsAppStatus.AdminReplied : WhatsAppStatus.CustomerContacted;
        const order = await this.orders.updateWhatsAppStatus(orderNumber, status);
        return { matched: true, orderNumber: order.orderNumber };
      } catch {
        // Fall through to logging as unmatched — the extracted/supplied
        // order number didn't correspond to a real order.
      }
    }
    await this.records.save(this.records.create({
      resource: 'webhook-events',
      reference: `whatsapp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      data: { channel: 'whatsapp', ...dto },
    }));
    return { matched: false };
  }
}
