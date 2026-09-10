import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ type: 'varchar', name: 'variation_id', nullable: true })
  variationId: string | null;

  @Column({ type: 'varchar', nullable: true })
  size: string | null;

  @Column({ type: 'varchar', nullable: true })
  colour: string | null;

  @Column()
  quantity: number;

  @Column('numeric', { name: 'unit_price', precision: 12, scale: 2, default: 0 })
  unitPrice: number;

  @Column('numeric', { precision: 12, scale: 2, default: 0 })
  total: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
