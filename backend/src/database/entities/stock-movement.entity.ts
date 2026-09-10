import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum StockMovementType {
  Receipt = 'receipt',
  Sale = 'sale',
  Reservation = 'reservation',
  Release = 'release',
  Adjustment = 'adjustment',
  Transfer = 'transfer',
  Return = 'return',
  Damage = 'damage',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'branch_id', default: 'head-office' })
  branchId: string;

  @Column({ type: 'simple-enum', enum: StockMovementType })
  type: StockMovementType;

  @Column()
  quantity: number;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', name: 'staff_id', nullable: true })
  staffId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
