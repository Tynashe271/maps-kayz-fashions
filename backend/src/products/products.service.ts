import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../database/entities/product.entity';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    private readonly sync: SyncService,
  ) {}

  async findAll(query: ProductQueryDto) {
    const { category, search } = query;
    const queryBuilder = this.products.createQueryBuilder('product');
    if (category) queryBuilder.andWhere('product.category = :category', { category });
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.sku) LIKE LOWER(:search) OR LOWER(product.brand) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }
    return queryBuilder.orderBy('product.name', 'ASC').getMany();
  }

  async findOne(id: string) {
    const product = await this.products.findOneBy({ id });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const product = await this.products.save(this.products.create(dto));
    this.sync.emit({ type: 'catalogue', resource: 'products', action: 'created', id: product.id });
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    const saved = await this.products.save({ ...product, ...dto });
    this.sync.emit({ type: 'catalogue', resource: 'products', action: 'updated', id });
    return saved;
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.products.remove(product);
    this.sync.emit({ type: 'catalogue', resource: 'products', action: 'deleted', id });
    return { deleted: true, product };
  }
}
