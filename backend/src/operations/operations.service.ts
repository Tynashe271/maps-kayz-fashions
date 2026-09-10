import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from '../database/entities/delivery.entity';
import { InventoryItem } from '../database/entities/inventory-item.entity';
import { ReturnRequest, ReturnStatus } from '../database/entities/return-request.entity';
import { StockMovement, StockMovementType } from '../database/entities/stock-movement.entity';
import { Product } from '../database/entities/product.entity';
import {
  AdjustStockDto,
  CreateDeliveryDto,
  CreateReturnDto,
  UpdateDeliveryDto,
  UpdateReturnDto,
} from './dto/operations.dto';

@Injectable()
export class OperationsService {
  constructor(
    @InjectRepository(InventoryItem) private readonly inventory: Repository<InventoryItem>,
    @InjectRepository(StockMovement) private readonly movements: Repository<StockMovement>,
    @InjectRepository(Delivery) private readonly deliveries: Repository<Delivery>,
    @InjectRepository(ReturnRequest) private readonly returns: Repository<ReturnRequest>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  listInventory(branchId?: string) {
    return this.inventory.find({ where: branchId ? { branchId } : {} });
  }

  async adjustStock(dto: AdjustStockDto) {
    const branchId = dto.branchId ?? 'head-office';
    let item = await this.inventory.findOne({ where: { productId: dto.productId, branchId } });
    if (!item) item = this.inventory.create({ productId: dto.productId, branchId });

    const nextAvailable = item.available + dto.quantity;
    if (nextAvailable < 0) throw new ConflictException('Insufficient available stock');
    item.available = nextAvailable;
    await this.inventory.save(item);
    const product = await this.products.findOneBy({ id: dto.productId });
    if (product) {
      const allBranchStock = await this.inventory.findBy({ productId: dto.productId });
      product.stock = allBranchStock.reduce((total, row) => total + row.available, 0);
      await this.products.save(product);
    }
    await this.movements.save(this.movements.create({ ...dto, branchId }));
    return item;
  }

  listStockMovements(productId?: string) {
    return this.movements.find({ where: productId ? { productId } : {}, order: { createdAt: 'DESC' } });
  }

  async createDelivery(dto: CreateDeliveryDto) {
    return this.deliveries.save(this.deliveries.create({ ...dto, status: DeliveryStatus.Pending }));
  }

  listDeliveries() {
    return this.deliveries.find({ order: { createdAt: 'DESC' } });
  }

  async updateDelivery(id: string, dto: UpdateDeliveryDto) {
    const delivery = await this.deliveries.findOneBy({ id });
    if (!delivery) throw new NotFoundException(`Delivery ${id} not found`);
    return this.deliveries.save({ ...delivery, ...dto });
  }

  async createReturn(dto: CreateReturnDto) {
    return this.returns.save(this.returns.create({ ...dto, status: ReturnStatus.Requested }));
  }

  listReturns() {
    return this.returns.find({ order: { createdAt: 'DESC' } });
  }

  async updateReturn(id: string, dto: UpdateReturnDto) {
    const request = await this.returns.findOneBy({ id });
    if (!request) throw new NotFoundException(`Return request ${id} not found`);
    return this.returns.save({ ...request, status: dto.status });
  }
}
