import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  sku: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column()
  brand: string;

  @Column('numeric', { precision: 12, scale: 2 })
  price: number;

  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  originalPrice: number | null;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: false })
  isFeatured: boolean;

  @Column('simple-json')
  colours: string[];

  @Column('simple-json')
  sizes: string[];

  @Column('text')
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', name: 'image_url', nullable: true })
  imageUrl: string | null;
}
