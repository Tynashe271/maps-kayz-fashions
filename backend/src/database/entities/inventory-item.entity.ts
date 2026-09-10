import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('inventory_items')
@Index(['productId', 'branchId'], { unique: true })
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'branch_id', default: 'head-office' })
  branchId: string;

  @Column({ default: 0 })
  available: number;

  @Column({ default: 0 })
  reserved: number;

  @Column({ name: 'incoming', default: 0 })
  incoming: number;

  @Column({ name: 'damaged', default: 0 })
  damaged: number;

  @Column({ name: 'reorder_level', default: 0 })
  reorderLevel: number;

  @Column({ name: 'safety_stock', default: 0 })
  safetyStock: number;
}
