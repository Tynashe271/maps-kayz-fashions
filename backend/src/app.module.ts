import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { AdminModule } from './admin/admin.module';
import { PromotionsModule } from './promotions/promotions.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { DatabaseModule } from './database/database.module';
import { OperationsModule } from './operations/operations.module';
import { PlatformModule } from './platform/platform.module';
import { AuthModule } from './auth/auth.module';
import { CartsModule } from './carts/carts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SyncModule } from './sync/sync.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    SyncModule,
    OperationsModule,
    PlatformModule,
    AuthModule,
    CartsModule,
    DashboardModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    CustomersModule,
    AdminModule,
    PromotionsModule,
    WhatsAppModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
