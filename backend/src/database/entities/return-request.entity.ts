import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ReturnStatus {
  Requested = 'requested',
  Approved = 'approved',
  Rejected = 'rejected',
  Received = 'received',
  Refunded = 'refunded',
  Exchanged = 'exchanged',
}

@Entity('return_requests')
export class ReturnRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ type: 'simple-enum', enum: ReturnStatus, default: ReturnStatus.Requested })
  status: ReturnStatus;

  @Column()
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
