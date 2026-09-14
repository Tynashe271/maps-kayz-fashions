import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductImageUrl1789387659593 implements MigrationInterface {
    name = 'ProductImageUrl1789387659593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "image_url" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "image_url"`);
    }

}
