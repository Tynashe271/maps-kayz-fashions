import { Injectable } from '@nestjs/common';
import { SendOrderMessageDto } from './dto';
import { Cart } from '../database/entities/cart.entity';

@Injectable()
export class WhatsAppService {
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
