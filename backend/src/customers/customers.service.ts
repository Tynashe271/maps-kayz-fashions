import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../database/entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
  ) {}

  findAll() {
    return this.customers.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const customer = await this.customers.findOneBy({ id });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  create(dto: CreateCustomerDto) {
    return this.customers.save(this.customers.create({ ...dto, loyaltyPoints: 0 }));
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    return this.customers.save({ ...customer, ...dto });
  }
}
