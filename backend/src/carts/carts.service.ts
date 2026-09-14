import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Cart, CartLine } from '../database/entities/cart.entity';
import { Product } from '../database/entities/product.entity';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { AddCartItemDto, CreateCartDto, SendCartWhatsAppDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart) private readonly carts: Repository<Cart>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    private readonly whatsApp: WhatsAppService,
  ) {}

  async create(dto: CreateCartDto) {
    return this.carts.save(this.carts.create({
      customerName: dto.customerName ?? null,
      customerPhone: dto.customerPhone ?? null,
      items: [],
    }));
  }

  async findOne(id: string) {
    const cart = await this.carts.findOneBy({ id });
    if (!cart) throw new NotFoundException(`Cart ${id} not found`);
    return this.withTotals(cart);
  }

  async addItem(cartId: string, dto: AddCartItemDto) {
    const cart = await this.getCart(cartId);
    const product = await this.products.findOneBy({ id: dto.productId, isActive: true });
    if (!product) throw new NotFoundException(`Product ${dto.productId} not found`);
    const existing = cart.items.find((item) => item.productId === dto.productId && item.size === dto.size && item.colour === dto.colour);
    if (existing) existing.quantity += dto.quantity;
    else cart.items = [...cart.items, {
      id: randomUUID(), productId: product.id, name: product.name, sku: product.sku,
      quantity: dto.quantity, unitPrice: Number(product.price), size: dto.size, colour: dto.colour,
    }];
    return this.withTotals(await this.carts.save(cart));
  }

  async updateItem(cartId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getCart(cartId);
    const item = cart.items.find((line) => line.id === itemId);
    if (!item) throw new NotFoundException(`Cart item ${itemId} not found`);
    item.quantity = dto.quantity;
    return this.withTotals(await this.carts.save(cart));
  }

  async removeItem(cartId: string, itemId: string) {
    const cart = await this.getCart(cartId);
    if (!cart.items.some((item) => item.id === itemId)) throw new NotFoundException(`Cart item ${itemId} not found`);
    cart.items = cart.items.filter((item) => item.id !== itemId);
    return this.withTotals(await this.carts.save(cart));
  }

  async sendToWhatsApp(cartId: string, dto: SendCartWhatsAppDto) {
    const cart = await this.getCart(cartId);
    if (!cart.items.length) throw new BadRequestException('Cannot send an empty cart');
    return this.whatsApp.prepareCartMessage(cart, dto.customerName);
  }

  private async getCart(id: string) {
    const cart = await this.carts.findOneBy({ id });
    if (!cart) throw new NotFoundException(`Cart ${id} not found`);
    return cart;
  }

  private withTotals(cart: Cart) {
    const total = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return { ...cart, itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0), total };
  }
}
