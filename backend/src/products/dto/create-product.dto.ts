import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Luxe Evening Gown' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'MK-W-FORMAL-101' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 'women-formal' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'Maps Kayz' })
  @IsString()
  brand: string;

  @ApiProperty({ example: 320 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 420, required: false })
  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @ApiProperty({ example: 18 })
  @IsNumber()
  stock: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ type: [String], example: ['Black', 'Gold'] })
  @IsArray()
  @IsString({ each: true })
  colours: string[];

  @ApiProperty({ type: [String], example: ['S', 'M', 'L'] })
  @IsArray()
  @IsString({ each: true })
  sizes: string[];

  @ApiProperty({ example: 'Elegant evening wear for premium occasions.' })
  @IsString()
  description: string;
}
