import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus, WhatsAppStatus } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { Product } from '../database/entities/product.entity';
import { InventoryItem } from '../database/entities/inventory-item.entity';
import { StockMovement, StockMovementType } from '../database/entities/stock-movement.entity';
import { Customer } from '../database/entities/customer.entity';
import { ReturnRequest, ReturnStatus } from '../database/entities/return-request.entity';
import { CreateOrderDto, UpdateOrderDto, OrderLookupDto, CreateReturnRequestDto } from './dto';
import { SyncService } from '../sync/sync.service';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.Pending]: [OrderStatus.AwaitingPayment, OrderStatus.PaymentConfirmed, OrderStatus.Cancelled],
  [OrderStatus.AwaitingPayment]: [OrderStatus.PaymentConfirmed, OrderStatus.PaymentFailed, OrderStatus.Cancelled],
  [OrderStatus.PaymentConfirmed]: [OrderStatus.Processing, OrderStatus.Cancelled, OrderStatus.Refunded],
  [OrderStatus.Processing]: [OrderStatus.Picking, OrderStatus.OnHold, OrderStatus.Cancelled],
  [OrderStatus.Picking]: [OrderStatus.Packed, OrderStatus.PartiallyFulfilled, OrderStatus.OnHold],
  [OrderStatus.Packed]: [OrderStatus.ReadyForCollection, OrderStatus.ReadyForDispatch],
  [OrderStatus.ReadyForCollection]: [OrderStatus.Delivered, OrderStatus.Cancelled],
  [OrderStatus.ReadyForDispatch]: [OrderStatus.Dispatched],
  [OrderStatus.Dispatched]: [OrderStatus.OutForDelivery, OrderStatus.Delivered],
  [OrderStatus.OutForDelivery]: [OrderStatus.Delivered, OrderStatus.OnHold],
  [OrderStatus.Delivered]: [OrderStatus.ReturnRequested],
  [OrderStatus.OnHold]: [OrderStatus.Processing, OrderStatus.Cancelled],
  [OrderStatus.PaymentFailed]: [OrderStatus.AwaitingPayment, OrderStatus.Cancelled],
  [OrderStatus.PartiallyFulfilled]: [OrderStatus.Packed, OrderStatus.Cancelled],
  [OrderStatus.Cancelled]: [],
  [OrderStatus.ReturnRequested]: [OrderStatus.Returned, OrderStatus.ExchangeProcessing],
  [OrderStatus.Returned]: [OrderStatus.Refunded, OrderStatus.ExchangeProcessing],
  [OrderStatus.ExchangeProcessing]: [OrderStatus.Delivered, OrderStatus.Refunded],
  [OrderStatus.Refunded]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
    @InjectRepository(ReturnRequest) private readonly returns: Repository<ReturnRequest>,
    private readonly dataSource: DataSource,
    private readonly sync: SyncService,
  ) {}

  // Public order tracking: order number + the email on the order's customer record
  // stands in for authentication here, the same way a WhatsApp order reference does —
  // there is no link between a logged-in shopper account and any order in this system.
  private async matchOrderToEmail(order: Order, email: string) {
    const customer = await this.customers.findOneBy({ id: order.customerId });
    return !!customer && customer.email.toLowerCase() === email.trim().toLowerCase();
  }

  async lookupOrder(dto: OrderLookupDto) {
    const order = await this.orders.findOne({ where: { orderNumber: dto.orderNumber.trim() }, relations: ['items'] });
    if (!order || !(await this.matchOrderToEmail(order, dto.email))) {
      // Same message either way so this can't be used to probe for valid order numbers.
      throw new NotFoundException('No order found for that order number and email');
    }
    const returnRequest = await this.returns.findOneBy({ orderId: order.id });
    return { order, returnRequest: returnRequest ?? null };
  }

  async requestReturn(orderId: string, dto: CreateReturnRequestDto) {
    const order = await this.orders.findOneBy({ id: orderId });
    if (!order || !(await this.matchOrderToEmail(order, dto.email))) {
      throw new NotFoundException('No order found for that order and email');
    }
    const existing = await this.returns.findOneBy({ orderId });
    if (existing) throw new ConflictException('A return request has already been logged for this order');
    const request = this.returns.create({
      orderId,
      customerId: order.customerId,
      reason: dto.reason,
      notes: dto.notes ?? null,
      status: ReturnStatus.Requested,
    });
    return this.returns.save(request);
  }

  findAll() { return this.orders.find({ order: { createdAt: 'DESC' } }); }

  async findOne(id: string) {
    const order = await this.orders.findOne({ where: { id }, relations: ['items'] });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async create(dto: CreateOrderDto) {
    const quantities = new Map<string, number>();
    for (const item of dto.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    if (!quantities.size) throw new BadRequestException('An order requires at least one item');
    const branchId = dto.branchId ?? 'head-office';

    let customerId = dto.customerId;
    if (dto.customer) {
      let customer = await this.customers.findOneBy({ email: dto.customer.email.toLowerCase() });
      customer = customer
        ? await this.customers.save({ ...customer, name: dto.customer.name, phone: dto.customer.phone })
        : await this.customers.save(this.customers.create({ name: dto.customer.name, email: dto.customer.email.toLowerCase(), phone: dto.customer.phone, loyaltyPoints: 0 }));
      customerId = customer.id;
    }
    if (!customerId) throw new BadRequestException('Customer details are required');

    return this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const productIds = [...quantities.keys()];
      const products = await manager.find(Product, { where: { id: In(productIds), isActive: true } });
      if (products.length !== productIds.length) throw new BadRequestException('One or more products are unavailable');
      const stockQuery = manager.createQueryBuilder(InventoryItem, 'stock')
        .where('stock.productId IN (:...productIds)', { productIds })
        .andWhere('stock.branchId = :branchId', { branchId });
      if (this.dataSource.options.type === 'postgres') stockQuery.setLock('pessimistic_write');
      const inventory = await stockQuery.getMany();
      const inventoryByProduct = new Map(inventory.map((item) => [item.productId, item]));
      const productsById = new Map(products.map((product) => [product.id, product]));
      for (const productId of productIds) {
        if (!inventoryByProduct.has(productId)) {
          const product = productsById.get(productId)!;
          const seededStock = manager.create(InventoryItem, { productId, branchId, available: product.stock, reserved: 0, incoming: 0, damaged: 0, reorderLevel: 5, safetyStock: 0 });
          inventoryByProduct.set(productId, await manager.save(seededStock));
        }
      }
      for (const [productId, quantity] of quantities) {
        const stock = inventoryByProduct.get(productId);
        if (!stock || stock.available < quantity) throw new ConflictException(`Insufficient stock for product ${productId}`);
      }

      const byId = new Map(products.map((product) => [product.id, product]));
      for (const item of dto.items) {
        const product = byId.get(item.productId)!;
        if (item.size && !product.sizes.includes(item.size)) throw new BadRequestException(`${item.size} is not available for ${product.name}`);
        if (item.colour && !product.colours.includes(item.colour)) throw new BadRequestException(`${item.colour} is not available for ${product.name}`);
      }
      const items = dto.items.map((item) => {
        const price = Number(byId.get(item.productId)!.price);
        return manager.create(OrderItem, { ...item, variationId: item.variationId ?? null, size:item.size??null, colour:item.colour??null, unitPrice: price, total: price * item.quantity });
      });
      const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);
      const isDelivery=(dto.fulfilmentMethod??'delivery')==='delivery';
      const deliveryFee=isDelivery&&dto.deliveryAddress?.city?.trim().toLowerCase()!=='bulawayo'?8:0;
      const order = manager.create(Order, {
        orderNumber: `MK-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        customerId, branchId, subtotal, discount: 0, deliveryFee, total: subtotal+deliveryFee,
        paymentMethod: dto.paymentMethod, paymentStatus:PaymentStatus.Unpaid,whatsappStatus:WhatsAppStatus.MessagePrepared,orderSource:'WEBSITE_WHATSAPP',fulfilmentMethod:dto.fulfilmentMethod??'delivery',deliveryAddress:(dto.deliveryAddress as Record<string,string>|undefined)??null,orderNotes:dto.orderNotes??null,status: OrderStatus.AwaitingPayment, items,
      });
      for (const [productId, quantity] of quantities) {
        const stock = inventoryByProduct.get(productId)!;
        stock.available -= quantity;
        stock.reserved += quantity;
        await manager.save(stock);
        const product = byId.get(productId)!;
        product.stock = Math.max(0, product.stock - quantity);
        await manager.save(product);
        await manager.save(manager.create(StockMovement, { productId, branchId, quantity, type: StockMovementType.Reservation, reason: 'Order checkout' }));
      }
      const saved=await manager.save(order);
      this.sync.emit({type:'order',resource:'orders',action:'created',id:saved.id});
      const customer=dto.customer??await this.customers.findOneBy({id:customerId});
      const nameById=new Map(products.map((product)=>[product.id,product.name]));
      const whatsapp=this.buildWhatsAppPayload(saved,nameById);
      return {...saved,customer,whatsapp:{...whatsapp,status:WhatsAppStatus.MessagePrepared},paymentLink:whatsapp.paymentLink};
    });
  }

  // The payment page the WhatsApp message links to lives in the customer
  // storefront (frontend/src/pages/PaymentPage.vue), served from the same
  // dev port the storefront already runs on — see frontend/vite.config.js.
  buildPaymentLink(orderNumber: string) {
    return `http://localhost:9990/pay/${orderNumber}`;
  }

  private buildWhatsAppPayload(order: Order, nameById: Map<string, string>) {
    const lines = order.items.map((item, index) => `${index + 1} × ${nameById.get(item.productId) || item.productId}\n${item.size ? `Size: ${item.size}\n` : ''}${item.colour ? `Colour: ${item.colour}\n` : ''}Price: US$${Number(item.total).toFixed(2)}`);
    const location = [order.deliveryAddress?.suburb, order.deliveryAddress?.city].filter(Boolean).join(', ');
    const paymentLink = this.buildPaymentLink(order.orderNumber);
    const message = [`Hello Maps Kayz Fashions.`, ``, `I have placed an order on your website.`, ``, `Order number: ${order.orderNumber}`, ``, `Items:`, ...lines, ``, `Delivery: US$${Number(order.deliveryFee).toFixed(2)}`, `Total: US$${Number(order.total).toFixed(2)}`, location ? `\nDelivery location:\n${location}` : '', ``, `Payment method: ${order.paymentMethod}`, `Payment link: ${paymentLink}`, ``, `Please confirm my order.`].filter(Boolean).join('\n');
    const businessNumber = (process.env.WHATSAPP_ORDER_NUMBER || '263781657310').replace(/\D/g, '');
    return { message, url: `https://wa.me/${businessNumber}?text=${encodeURIComponent(message)}`, paymentLink };
  }

  // Order-number-scoped lookup used by admin actions and webhooks — distinct
  // from findOne(), which is keyed by the internal uuid id.
  async findByOrderNumber(orderNumber: string) {
    const order = await this.orders.findOne({ where: { orderNumber: orderNumber.trim() }, relations: ['items'] });
    if (!order) throw new NotFoundException(`Order ${orderNumber} not found`);
    return order;
  }

  private async requireOrderByNumberAndEmail(orderNumber: string, email: string) {
    const order = await this.findByOrderNumber(orderNumber);
    if (!(await this.matchOrderToEmail(order, email))) {
      throw new NotFoundException('No order found for that order number and email');
    }
    return order;
  }

  // GET /orders/by-number/:orderNumber — public, email-verified. Backs the
  // customer-facing payment page (Step 6/7 of the ordering workflow), which
  // only has the order number and the email the customer typed at checkout.
  lookupByOrderNumber(orderNumber: string, email: string) {
    return this.requireOrderByNumberAndEmail(orderNumber, email);
  }

  private async productNamesFor(order: Order) {
    const productIds = [...new Set(order.items.map((item) => item.productId))];
    const products = await this.orders.manager.find(Product, { where: { id: In(productIds) } });
    return new Map(products.map((product) => [product.id, product.name]));
  }

  // POST /orders/:orderNumber/whatsapp-link — staff-only "Resend WhatsApp summary".
  async regenerateWhatsAppLink(orderNumber: string) {
    const order = await this.findByOrderNumber(orderNumber);
    return this.buildWhatsAppPayload(order, await this.productNamesFor(order));
  }

  // POST /orders/:orderNumber/payment-link — staff-only "Copy order summary" companion.
  async regeneratePaymentLink(orderNumber: string) {
    const order = await this.findByOrderNumber(orderNumber);
    return { orderNumber: order.orderNumber, paymentLink: this.buildPaymentLink(order.orderNumber) };
  }

  // POST /orders/:orderNumber/payment-proof — customer submits a ZIPIT/bank
  // reference from the payment page. Never marks the order paid by itself —
  // only an admin verifying it (or a payment webhook) does that.
  async submitPaymentProof(orderNumber: string, dto: { email: string; reference?: string; note?: string }) {
    const order = await this.requireOrderByNumberAndEmail(orderNumber, dto.email);
    if (order.paymentStatus === PaymentStatus.Paid) throw new ConflictException('This order is already paid');
    order.paymentStatus = PaymentStatus.ProofSubmitted;
    if (dto.reference) order.paymentReference = dto.reference;
    if (dto.note) order.paymentProofNote = dto.note;
    const saved = await this.orders.save(order);
    this.sync.emit({ type: 'order', resource: 'orders', action: 'updated', id: saved.id });
    return saved;
  }

  // POST /orders/:orderNumber/cancel — customer self-service cancellation of
  // an unpaid order, email-verified the same way order tracking is. Unlike
  // the admin status transition this always allows, self-service stops once
  // money has actually moved — from here the customer needs to talk to us.
  async cancelByOrderNumber(orderNumber: string, email: string) {
    const order = await this.requireOrderByNumberAndEmail(orderNumber, email);
    if (order.paymentStatus === PaymentStatus.Paid) {
      throw new ConflictException('This order is already paid — contact us to cancel or request a refund');
    }
    return this.update(order.id, { status: OrderStatus.Cancelled } as UpdateOrderDto);
  }

  // PATCH /admin/orders/:orderNumber/status — same validated transition as
  // update(), addressed by the human-readable order number for admin use.
  async updateStatusByOrderNumber(orderNumber: string, dto: UpdateOrderDto) {
    const order = await this.findByOrderNumber(orderNumber);
    return this.update(order.id, dto);
  }

  // GET /admin/orders — optionally filtered for the admin app's
  // "New Website Orders" / "Awaiting Payment" / "Paid Orders" views.
  findAllFiltered(filter: { status?: OrderStatus; paymentStatus?: PaymentStatus; whatsappStatus?: WhatsAppStatus }) {
    const where: FindOptionsWhere<Order> = {};
    if (filter.status) where.status = filter.status;
    if (filter.paymentStatus) where.paymentStatus = filter.paymentStatus;
    if (filter.whatsappStatus) where.whatsappStatus = filter.whatsappStatus;
    return this.orders.find({ where, order: { createdAt: 'DESC' } });
  }

  // Admin "Confirm-payment" button, and the success path of POST /webhooks/payment.
  // The backend must never take a customer's word (or a return to a success page)
  // that money arrived — this is the one place PaymentStatus.Paid gets set.
  async verifyPayment(orderNumber: string, reference?: string) {
    const order = await this.findByOrderNumber(orderNumber);
    if (order.paymentStatus === PaymentStatus.Paid) return order;
    order.paymentStatus = PaymentStatus.Paid;
    if (reference) order.paymentReference = reference;
    if ([OrderStatus.Pending, OrderStatus.AwaitingPayment, OrderStatus.PaymentFailed].includes(order.status)) {
      order.status = OrderStatus.PaymentConfirmed;
    }
    const saved = await this.orders.save(order);
    this.sync.emit({ type: 'order', resource: 'orders', action: 'updated', id: saved.id });
    return saved;
  }

  // Failure path of POST /webhooks/payment. Payment providers can retry or
  // deliver webhooks out of order — never let a stale "failed" notification
  // downgrade an order a "paid" notification (or an admin) already verified.
  async markPaymentFailed(orderNumber: string, reference?: string) {
    const order = await this.findByOrderNumber(orderNumber);
    if (order.paymentStatus === PaymentStatus.Paid) return order;
    order.paymentStatus = PaymentStatus.Failed;
    if (reference) order.paymentReference = reference;
    if (order.status === OrderStatus.AwaitingPayment) order.status = OrderStatus.PaymentFailed;
    const saved = await this.orders.save(order);
    this.sync.emit({ type: 'order', resource: 'orders', action: 'updated', id: saved.id });
    return saved;
  }

  // Used by POST /webhooks/whatsapp once a conversation is matched to an order.
  async updateWhatsAppStatus(orderNumber: string, status: WhatsAppStatus) {
    const order = await this.findByOrderNumber(orderNumber);
    order.whatsappStatus = status;
    const saved = await this.orders.save(order);
    this.sync.emit({ type: 'order', resource: 'orders', action: 'updated', id: saved.id });
    return saved;
  }

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.findOne(id);
    if (!dto.status || dto.status === order.status) return order;
    if (!ALLOWED_TRANSITIONS[order.status].includes(dto.status)) {
      throw new ConflictException(`Order cannot move from ${order.status} to ${dto.status}`);
    }
    return this.dataSource.transaction(async (manager) => {
      if (dto.status === OrderStatus.Cancelled) {
        for (const item of order.items) {
          const stockQuery = manager.createQueryBuilder(InventoryItem, 'stock')
            .where('stock.productId = :productId', { productId: item.productId })
            .andWhere('stock.branchId = :branchId', { branchId: order.branchId });
          if (this.dataSource.options.type === 'postgres') stockQuery.setLock('pessimistic_write');
          const stock = await stockQuery.getOne();
          if (stock) {
            stock.reserved = Math.max(0, stock.reserved - item.quantity);
            stock.available += item.quantity;
            await manager.save(stock);
            const product = await manager.findOneBy(Product, { id: item.productId });
            if (product) {
              product.stock += item.quantity;
              await manager.save(product);
            }
            await manager.save(manager.create(StockMovement, { productId: item.productId, branchId: order.branchId, quantity: item.quantity, type: StockMovementType.Release, reason: `Cancelled order ${order.orderNumber}` }));
          }
        }
      }
      order.status = dto.status as OrderStatus;
      return manager.save(order);
    });
  }
}
