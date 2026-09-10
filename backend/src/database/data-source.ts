import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Customer } from './entities/customer.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { Delivery } from './entities/delivery.entity';
import { ReturnRequest } from './entities/return-request.entity';
import { PlatformRecord } from './entities/platform-record.entity';
import { UserAccount } from './entities/user-account.entity';
import { Cart } from './entities/cart.entity';

// TypeORM CLI entry point ONLY — used for `npm run migration:generate` /
// `migration:run` / `migration:revert` against Postgres (see package.json).
// The app itself connects via database.module.ts, which mirrors this same
// entity list; keep the two in sync when adding an entity. Not used for
// local sqlite dev, which still relies on synchronize:true there.
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Product, Category, Customer, Order, OrderItem, InventoryItem, StockMovement, Delivery, ReturnRequest, PlatformRecord, UserAccount, Cart],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
