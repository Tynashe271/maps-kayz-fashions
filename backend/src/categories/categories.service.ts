import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../database/entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  findAll() {
    return this.categories.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const category = await this.categories.findOneBy({ id });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  create(dto: CreateCategoryDto) {
    return this.categories.save(this.categories.create({ ...dto, parentId: dto.parentId ?? null }));
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    return this.categories.save({ ...category, ...dto });
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    await this.categories.remove(category);
    return { deleted: true, category };
  }
}
