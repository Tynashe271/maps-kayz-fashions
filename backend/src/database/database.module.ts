import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Customer } from './entities/customer.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { Product } from './entities/product.entity';
import { Delivery } from './entities/delivery.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { ReturnRequest } from './entities/return-request.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { PlatformRecord } from './entities/platform-record.entity';
import { UserAccount } from './entities/user-account.entity';
import { Cart } from './entities/cart.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const production = config.get('NODE_ENV') === 'production';
        const databaseUrl = config.get<string>('DATABASE_URL');
        if (production && !databaseUrl) throw new Error('DATABASE_URL is required when NODE_ENV=production');
        const connection = databaseUrl
          ? { type: 'postgres' as const, url: databaseUrl }
          : { type: 'sqlite' as const, database: config.get('DATABASE_PATH', 'maps-kayz.sqlite') };
        return {
        ...connection,
        entities: [
          Product,
          Category,
          Customer,
          Order,
          OrderItem,
          InventoryItem,
          StockMovement,
          Delivery,
          ReturnRequest,
          PlatformRecord,
          UserAccount,
          Cart,
        ],
        synchronize: !production,
        autoLoadEntities: true,
        // Production (always Postgres — see the DATABASE_URL check above)
        // schemas come from migrations, not synchronize:true, which is only
        // safe for the disposable local sqlite database. Generate/run these
        // with `npm run migration:generate` / `migration:run` — see
        // src/database/data-source.ts and src/database/migrations/.
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: production,
      }},
    }),
  ],
})
export class DatabaseModule {}
