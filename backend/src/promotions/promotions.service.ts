import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePromotionDto, UpdatePromotionDto } from './dto';

@Injectable()
export class PromotionsService {
  private promotions = [
    {
      id: 'promo-1',
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      active: true,
    },
  ];

  findAll() {
    return this.promotions;
  }

  create(dto: CreatePromotionDto) {
    const created = {
      id: `promo-${Date.now()}`,
      ...dto,
    };
    this.promotions.push(created);
    return created;
  }

  update(id: string, dto: UpdatePromotionDto) {
    const index = this.promotions.findIndex((item) => item.id === id);
    if (index === -1) throw new NotFoundException(`Promotion ${id} not found`);
    this.promotions[index] = { ...this.promotions[index], ...dto };
    return this.promotions[index];
  }
}
