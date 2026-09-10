import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../database/entities/cart.entity';
import { Product } from '../database/entities/product.entity';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, Product]), WhatsAppModule],
  controllers: [CartsController],
  providers: [CartsService],
})
export class CartsModule {}
