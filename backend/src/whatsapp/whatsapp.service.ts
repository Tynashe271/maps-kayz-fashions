import { Injectable, Logger } from '@nestjs/common';
import { SendOrderMessageDto } from './dto';
import { Cart } from '../database/entities/cart.entity';

// Real, server-initiated WhatsApp messages via Meta's WhatsApp Business
// Cloud API (https://developers.facebook.com/docs/whatsapp/cloud-api) — the
// business creates a Meta app, adds the WhatsApp product, and gets a phone
// number ID + access token from that app's dashboard. Configured through:
//   WHATSAPP_ACCESS_TOKEN     — permanent (or temporary, for testing) token
//   WHATSAPP_PHONE_NUMBER_ID  — the "from" number's id (not the number itself)
//   WHATSAPP_GRAPH_API_VERSION — optional, defaults below
// Distinct from WHATSAPP_ORDER_NUMBER, which only feeds the click-to-chat
// wa.me links used elsewhere in this file and in orders.service.ts — those
// need no account at all, just a phone number, and keep working regardless
// of whether the Cloud API is configured.
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  isCloudApiConfigured() {
    return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  }

  // Sends a free-form text message through the Cloud API. Meta only allows
  // free-form (non-template) messages to a number that has messaged the
  // business's WhatsApp number within the last 24 hours ("customer service
  // window") — fine for receipts/alerts that follow an order or a staff
  // action, but outbound-only reminders would need an approved template
  // instead. Never throws: callers (receipts, stock alerts) shouldn't fail
  // the operation they're attached to just because a WhatsApp send failed
  // or isn't configured — they get {sent:false, reason} back instead.
  async sendCloudApiMessage(to: string, body: string): Promise<{ sent: boolean; reason?: string; id?: string }> {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) {
      this.logger.warn(`WhatsApp Cloud API not configured — skipped message to ${to}`);
      return { sent: false, reason: 'not_configured' };
    }
    const digits = to.replace(/\D/g, '');
    if (!digits) return { sent: false, reason: 'invalid_number' };
    const version = process.env.WHATSAPP_GRAPH_API_VERSION || 'v20.0';
    try {
      const res = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: digits, type: 'text', text: { body } }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        this.logger.error(`WhatsApp Cloud API send failed (${res.status}): ${JSON.stringify(payload)}`);
        return { sent: false, reason: payload?.error?.message || `http_${res.status}` };
      }
      return { sent: true, id: payload?.messages?.[0]?.id };
    } catch (error) {
      this.logger.error(`WhatsApp Cloud API request error: ${(error as Error).message}`);
      return { sent: false, reason: 'request_failed' };
    }
  }

  sendOrderMessage(dto: SendOrderMessageDto) {
    return {
      success: true,
      message: 'WhatsApp message prepared for customer support.',
      payload: dto,
    };
  }

  prepareCartMessage(cart: Cart, suppliedName?: string) {
    const customerName = suppliedName ?? cart.customerName ?? 'Customer';
    const lines = cart.items.map((item, index) => {
      const options = [item.size && `Size: ${item.size}`, item.colour && `Colour: ${item.colour}`].filter(Boolean);
      return `${index + 1}. ${item.name} (${item.sku}) x${item.quantity} - $${(item.unitPrice * item.quantity).toFixed(2)}${options.length ? ` [${options.join(', ')}]` : ''}`;
    });
    const total = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const message = [`Hello, I am ${customerName}. I would like to order:`, '', ...lines, '', `Cart total: $${total.toFixed(2)}`, `Cart reference: ${cart.id}`].join('\n');
    const businessNumber = (process.env.WHATSAPP_ORDER_NUMBER ?? '').replace(/\D/g, '');
    return {
      success: true,
      message,
      whatsappUrl: `https://wa.me/${businessNumber}?text=${encodeURIComponent(message)}`,
      configured: Boolean(businessNumber),
    };
  }
}
