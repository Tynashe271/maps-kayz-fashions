import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PLATFORM_RESOURCES, PlatformRecord } from '../database/entities/platform-record.entity';
import { CreatePlatformRecordDto, UpdatePlatformRecordDto } from './dto/platform-record.dto';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(PlatformRecord)
    private readonly records: Repository<PlatformRecord>,
    private readonly sync: SyncService,
  ) {}

  private validateResource(resource: string) {
    if (!PLATFORM_RESOURCES.includes(resource as (typeof PLATFORM_RESOURCES)[number])) {
      throw new BadRequestException(`Unsupported platform resource: ${resource}`);
    }
  }

  list(resource: string) {
    this.validateResource(resource);
    return this.records.find({ where: { resource }, order: { createdAt: 'DESC' } });
  }

  async findOne(resource: string, id: string) {
    this.validateResource(resource);
    const record = await this.records.findOneBy({ id, resource });
    if (!record) throw new NotFoundException(`${resource} record ${id} not found`);
    return record;
  }

  async create(resource: string, dto: CreatePlatformRecordDto) {
    this.validateResource(resource);
    const saved = await this.records.save(this.records.create({
      resource,
      reference: dto.reference,
      data: dto.data,
      active: dto.active ?? true,
    }));
    this.sync.emit({ type: 'platform', resource, action: 'created', id: saved.id });
    return saved;
  }

  async update(resource: string, id: string, dto: UpdatePlatformRecordDto) {
    const record = await this.findOne(resource, id);
    const saved = await this.records.save({ ...record, ...dto });
    this.sync.emit({ type: 'platform', resource, action: 'updated', id });
    const customerResources = ['reviews', 'product-questions', 'support-tickets'];
    if (customerResources.includes(resource) && saved.data?.userId) {
      const titles: Record<string,string> = { reviews: 'Your review was updated', 'product-questions': 'Your product question was answered', 'support-tickets': 'Your support ticket was updated' };
      await this.records.save(this.records.create({
        resource: 'notifications',
        reference: `${saved.data.userId}:notification:${Date.now()}`,
        data: { userId: saved.data.userId, email: saved.data.email, type: 'Account update', title: titles[resource], body: String(saved.data.answer || saved.data.reply || saved.data.status || 'Our team has updated your request.'), read: false },
        active: true,
      }));
    }
    return saved;
  }

  async remove(resource: string, id: string) {
    const record = await this.findOne(resource, id);
    await this.records.remove(record);
    this.sync.emit({ type: 'platform', resource, action: 'deleted', id });
    return { deleted: true, record };
  }

  async summary() {
    const records = await this.records.find();
    return PLATFORM_RESOURCES.reduce<Record<string, number>>((summary, resource) => {
      summary[resource] = records.filter((record) => record.resource === resource).length;
      return summary;
    }, {});
  }
}
