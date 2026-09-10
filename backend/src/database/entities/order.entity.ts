import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  Pending = 'Pending',
  AwaitingPayment = 'Awaiting Payment',
  PaymentConfirmed = 'Payment Confirmed',
  Processing = 'Processing',
  Picking = 'Picking',
  Packed = 'Packed',
  ReadyForCollection = 'Ready for Collection',
  ReadyForDispatch = 'Ready for Dispatch',
  Dispatched = 'Dispatched',
  OutForDelivery = 'Out for Delivery',
  Delivered = 'Delivered',
  OnHold = 'On hold',
  PaymentFailed = 'Payment failed',
  PartiallyFulfilled = 'Partially fulfilled',
  Cancelled = 'Cancelled',
  ReturnRequested = 'Return requested',
  Returned = 'Returned',
  ExchangeProcessing = 'Exchange processing',
  Refunded = 'Refunded',
}

export enum PaymentStatus { Unpaid='UNPAID', Pending='PENDING', ProofSubmitted='PROOF_SUBMITTED', UnderReview='UNDER_REVIEW', Paid='PAID', Failed='FAILED', Rejected='REJECTED', Refunded='REFUNDED', PartiallyRefunded='PARTIALLY_REFUNDED' }
export enum WhatsAppStatus { NotOpened='NOT_OPENED', MessagePrepared='MESSAGE_PREPARED', CustomerContacted='CUSTOMER_CONTACTED', AdminReplied='ADMIN_REPLIED', ConversationClosed='CONVERSATION_CLOSED' }

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'order_number' })
  orderNumber: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'branch_id', default: 'head-office' })
  branchId: string;

  @Column({ type: 'simple-enum', enum: OrderStatus, default: OrderStatus.Pending })
  status: OrderStatus;

  @Column('numeric', { precision: 12, scale: 2 })
  total: number;

  @Column('numeric', { precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column('numeric', { precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column()
  paymentMethod: string;

  @Column({ name: 'payment_status', default: PaymentStatus.Unpaid })
  paymentStatus: PaymentStatus;

  @Column({ name: 'whatsapp_status', default: WhatsAppStatus.NotOpened })
  whatsappStatus: WhatsAppStatus;

  @Column({ name: 'order_source', default: 'WEBSITE_WHATSAPP' })
  orderSource: string;

  @Column({ name: 'fulfilment_method', default: 'delivery' })
  fulfilmentMethod: string;

  @Column('numeric', { name: 'delivery_fee', precision: 12, scale: 2, default: 0 })
  deliveryFee: number;

  @Column('simple-json', { name: 'delivery_address', nullable: true })
  deliveryAddress: Record<string,string> | null;

  @Column('text', { name: 'order_notes', nullable: true })
  orderNotes: string | null;

  // Set once a payment provider webhook or a customer's proof-of-payment
  // submission references a specific transaction — never trusted on its own,
  // only ever paired with a paymentStatus change made by the backend.
  @Column({ type: 'varchar', name: 'payment_reference', nullable: true })
  paymentReference: string | null;

  // Free-text note/reference the customer supplies alongside a manual
  // EFT/ZIPIT proof of payment (see orders.service#submitPaymentProof).
  @Column('text', { name: 'payment_proof_note', nullable: true })
  paymentProofNote: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
