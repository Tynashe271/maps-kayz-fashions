import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1789072817575 implements MigrationInterface {
    name = 'InitialSchema1789072817575'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sku" character varying NOT NULL, "name" character varying NOT NULL, "category" character varying NOT NULL, "brand" character varying NOT NULL, "price" numeric(12,2) NOT NULL, "originalPrice" numeric(12,2), "stock" integer NOT NULL DEFAULT '0', "isFeatured" boolean NOT NULL DEFAULT false, "colours" text NOT NULL, "sizes" text NOT NULL, "description" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c44ac33a05b144dd0d9ddcf932" ON "products" ("sku") `);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "parent_id" character varying, CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "loyalty_points" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" character varying NOT NULL, "variation_id" character varying, "size" character varying, "colour" character varying, "quantity" integer NOT NULL, "unit_price" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "order_id" uuid, CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('Pending', 'Awaiting Payment', 'Payment Confirmed', 'Processing', 'Picking', 'Packed', 'Ready for Collection', 'Ready for Dispatch', 'Dispatched', 'Out for Delivery', 'Delivered', 'On hold', 'Payment failed', 'Partially fulfilled', 'Cancelled', 'Return requested', 'Returned', 'Exchange processing', 'Refunded')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_number" character varying NOT NULL, "customer_id" character varying NOT NULL, "branch_id" character varying NOT NULL DEFAULT 'head-office', "status" "public"."orders_status_enum" NOT NULL DEFAULT 'Pending', "total" numeric(12,2) NOT NULL, "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "discount" numeric(12,2) NOT NULL DEFAULT '0', "paymentMethod" character varying NOT NULL, "payment_status" character varying NOT NULL DEFAULT 'UNPAID', "whatsapp_status" character varying NOT NULL DEFAULT 'NOT_OPENED', "order_source" character varying NOT NULL DEFAULT 'WEBSITE_WHATSAPP', "fulfilment_method" character varying NOT NULL DEFAULT 'delivery', "delivery_fee" numeric(12,2) NOT NULL DEFAULT '0', "delivery_address" text, "order_notes" text, "payment_reference" character varying, "payment_proof_note" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_75eba1c6b1a66b09f2a97e6927" ON "orders" ("order_number") `);
        await queryRunner.query(`CREATE TABLE "inventory_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" character varying NOT NULL, "branch_id" character varying NOT NULL DEFAULT 'head-office', "available" integer NOT NULL DEFAULT '0', "reserved" integer NOT NULL DEFAULT '0', "incoming" integer NOT NULL DEFAULT '0', "damaged" integer NOT NULL DEFAULT '0', "reorder_level" integer NOT NULL DEFAULT '0', "safety_stock" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_cf2f451407242e132547ac19169" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4ae946e2a5d9e0d8278cf8098b" ON "inventory_items" ("product_id", "branch_id") `);
        await queryRunner.query(`CREATE TYPE "public"."stock_movements_type_enum" AS ENUM('receipt', 'sale', 'reservation', 'release', 'adjustment', 'transfer', 'return', 'damage')`);
        await queryRunner.query(`CREATE TABLE "stock_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" character varying NOT NULL, "branch_id" character varying NOT NULL DEFAULT 'head-office', "type" "public"."stock_movements_type_enum" NOT NULL, "quantity" integer NOT NULL, "reason" character varying, "staff_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_57a26b190618550d8e65fb860e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."deliveries_status_enum" AS ENUM('pending', 'packed', 'dispatched', 'out_for_delivery', 'delivered', 'failed', 'collected')`);
        await queryRunner.query(`CREATE TABLE "deliveries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" character varying NOT NULL, "method" character varying NOT NULL DEFAULT 'delivery', "status" "public"."deliveries_status_enum" NOT NULL DEFAULT 'pending', "address" character varying, "tracking_number" character varying, "courier_name" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_789dba7900f6d25550280ad3b93" UNIQUE ("order_id"), CONSTRAINT "UQ_e8e6e9ab0d3ef1e89b79073514d" UNIQUE ("tracking_number"), CONSTRAINT "PK_a6ef225c5c5f0974e503bfb731f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."return_requests_status_enum" AS ENUM('requested', 'approved', 'rejected', 'received', 'refunded', 'exchanged')`);
        await queryRunner.query(`CREATE TABLE "return_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" character varying NOT NULL, "customer_id" character varying NOT NULL, "status" "public"."return_requests_status_enum" NOT NULL DEFAULT 'requested', "reason" character varying NOT NULL, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_38714de8942bd9bc3a450a06889" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "platform_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "resource" character varying NOT NULL, "reference" character varying NOT NULL, "data" text NOT NULL, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c54446e4a9fb5c77389cdd0df49" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a34f52bf301a674c1e07e48056" ON "platform_records" ("resource", "reference") `);
        await queryRunner.query(`CREATE TYPE "public"."user_accounts_role_enum" AS ENUM('customer', 'super_admin', 'owner', 'manager', 'staff')`);
        await queryRunner.query(`CREATE TABLE "user_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."user_accounts_role_enum" NOT NULL DEFAULT 'customer', "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_df3802ec9c31dd9491e3589378d" UNIQUE ("email"), CONSTRAINT "PK_125e915cf23ad1cfb43815ce59b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shopping_carts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerName" character varying, "customerPhone" character varying, "items" text NOT NULL DEFAULT '[]', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7420877774b880a61269dda7e8a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`DROP TABLE "shopping_carts"`);
        await queryRunner.query(`DROP TABLE "user_accounts"`);
        await queryRunner.query(`DROP TYPE "public"."user_accounts_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a34f52bf301a674c1e07e48056"`);
        await queryRunner.query(`DROP TABLE "platform_records"`);
        await queryRunner.query(`DROP TABLE "return_requests"`);
        await queryRunner.query(`DROP TYPE "public"."return_requests_status_enum"`);
        await queryRunner.query(`DROP TABLE "deliveries"`);
        await queryRunner.query(`DROP TYPE "public"."deliveries_status_enum"`);
        await queryRunner.query(`DROP TABLE "stock_movements"`);
        await queryRunner.query(`DROP TYPE "public"."stock_movements_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4ae946e2a5d9e0d8278cf8098b"`);
        await queryRunner.query(`DROP TABLE "inventory_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_75eba1c6b1a66b09f2a97e6927"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c44ac33a05b144dd0d9ddcf932"`);
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
