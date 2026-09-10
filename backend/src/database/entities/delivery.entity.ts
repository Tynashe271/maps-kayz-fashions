import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum DeliveryStatus {
  Pending = 'pending',
  Packed = 'packed',
  Dispatched = 'dispatched',
  OutForDelivery = 'out_for_delivery',
  Delivered = 'delivered',
  Failed = 'failed',
  Collected = 'collected',
}

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', unique: true })
  orderId: string;

  @Column({ default: 'delivery' })
  method: string;

  @Column({ type: 'simple-enum', enum: DeliveryStatus, default: DeliveryStatus.Pending })
  status: DeliveryStatus;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', name: 'tracking_number', nullable: true, unique: true })
  trackingNumber: string | null;

  @Column({ type: 'varchar', name: 'courier_name', nullable: true })
  courierName: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
