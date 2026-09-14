import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformRecord } from '../database/entities/platform-record.entity';
import { Order } from '../database/entities/order.entity';
import { Customer } from '../database/entities/customer.entity';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

export interface ReceiptLine {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Two related "push" concerns that both ride on the generic platform-records
// store (resources 'restock-alerts' and 'receipts' — see
// database/entities/platform-record.entity.ts#PLATFORM_RESOURCES) and both
// notify over WhatsApp when it's configured (whatsapp/whatsapp.service.ts).
// Kept in one small global module so operations.service.ts and
// orders.service.ts can both reach it without a circular module import.
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(PlatformRecord) private readonly records: Repository<PlatformRecord>,
    private readonly whatsapp: WhatsAppService,
  ) {}

  // Only fire once per crossing, not on every stock movement while a
  // product stays low — compares the available count from just before this
  // change to the count after it. previousAvailable is undefined for a
  // freshly-seeded inventory row, which is treated as "was already low"
  // (skip) rather than a false-positive alert on first sight of a product.
  shouldAlert(previousAvailable: number | undefined, available: number, reorderLevel: number) {
    if (available > reorderLevel) return false;
    if (previousAvailable === undefined) return false;
    return previousAvailable > reorderLevel;
  }

  async recordLowStockAlert(input: { productId: string; productName: string; sku: string; branchId: string; available: number; reorderLevel: number }) {
    const record = await this.records.save(this.records.create({
      resource: 'restock-alerts',
      reference: `${input.productId}:${input.branchId}:${Date.now()}`,
      data: { ...input, triggeredAt: new Date().toISOString() },
      active: true,
    }));
    const message = [
      '⚠️ Low stock alert — Maps Kayz Fashions',
      '',
      `${input.productName} (${input.sku})`,
      `Branch: ${input.branchId}`,
      `Available: ${input.available} (reorder level ${input.reorderLevel})`,
      '',
      'Please restock soon.',
    ].join('\n');
    const to = process.env.WHATSAPP_ALERT_NUMBER || process.env.WHATSAPP_ORDER_NUMBER;
    if (to) await this.whatsapp.sendCloudApiMessage(to, message);
    return record;
  }

  private buildReceiptMessage(order: Order, lines: ReceiptLine[]) {
    const itemLines = lines.map((line, index) => `${index + 1}. ${line.name} x${line.quantity} — US$${line.total.toFixed(2)}`);
    return [
      'Receipt — Maps Kayz Fashions',
      '',
      `Order: ${order.orderNumber}`,
      `Date: ${new Date(order.createdAt).toLocaleDateString()}`,
      '',
      ...itemLines,
      '',
      `Subtotal: US$${Number(order.subtotal).toFixed(2)}`,
      Number(order.deliveryFee) ? `Delivery: US$${Number(order.deliveryFee).toFixed(2)}` : null,
      Number(order.discount) ? `Discount: -US$${Number(order.discount).toFixed(2)}` : null,
      `Total: US$${Number(order.total).toFixed(2)}`,
      `Payment: ${order.paymentMethod} (${order.paymentStatus})`,
      '',
      'Thank you for shopping with us!',
    ].filter((line): line is string => line !== null).join('\n');
  }

  buildReceiptData(order: Order, customer: Customer | null, lines: ReceiptLine[]) {
    return {
      orderNumber: order.orderNumber,
      issuedAt: new Date().toISOString(),
      customerName: customer?.name ?? 'Customer',
      customerEmail: customer?.email ?? null,
      items: lines,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      discount: Number(order.discount),
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    };
  }

  // Persists the receipt under resource 'receipts' (reference = order
  // number, so re-sending upserts the same record instead of duplicating
  // it) and, when the customer has a phone number and the Cloud API is
  // configured, sends it as a WhatsApp text message.
  async recordAndSendReceipt(order: Order, customer: Customer | null, lines: ReceiptLine[]) {
    const data = this.buildReceiptData(order, customer, lines);
    const existing = await this.records.findOne({ where: { resource: 'receipts', reference: order.orderNumber } });
    const record = await this.records.save(existing ? { ...existing, data } : this.records.create({ resource: 'receipts', reference: order.orderNumber, data, active: true }));
    const message = this.buildReceiptMessage(order, lines);
    const whatsapp = customer?.phone ? await this.whatsapp.sendCloudApiMessage(customer.phone, message) : { sent: false, reason: 'no_customer_phone' as const };
    return { record, message, whatsapp };
  }
}
