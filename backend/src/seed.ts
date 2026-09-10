/** Initial local setup. Creates the administrator account only. */
import 'reflect-metadata';
import { randomBytes, scryptSync } from 'crypto';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { Product } from './database/entities/product.entity';
import { Category } from './database/entities/category.entity';
import { Customer } from './database/entities/customer.entity';
import { Order } from './database/entities/order.entity';
import { OrderItem } from './database/entities/order-item.entity';
import { InventoryItem } from './database/entities/inventory-item.entity';
import { StockMovement } from './database/entities/stock-movement.entity';
import { Delivery } from './database/entities/delivery.entity';
import { ReturnRequest } from './database/entities/return-request.entity';
import { PlatformRecord } from './database/entities/platform-record.entity';
import { UserAccount, UserRole } from './database/entities/user-account.entity';
import { Cart } from './database/entities/cart.entity';

loadEnv();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

async function main() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: process.env.DATABASE_PATH ?? 'maps-kayz.sqlite',
    entities: [Product, Category, Customer, Order, OrderItem, InventoryItem, StockMovement, Delivery, ReturnRequest, PlatformRecord, UserAccount, Cart],
    synchronize: true,
  });
  await dataSource.initialize();
  const email = process.env.ADMIN_EMAIL ?? 'admin@mapskayz.com';
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
  const users = dataSource.getRepository(UserAccount);
  if (!(await users.findOneBy({ email }))) {
    await users.save(users.create({ email, passwordHash: hashPassword(password), role: UserRole.SuperAdmin, active: true }));
    console.log(`Administrator account created: ${email}`);
  } else console.log(`Administrator account already exists: ${email}`);
  await dataSource.destroy();
}

main().catch((error) => { console.error('Initial setup failed:', error); process.exit(1); });
