import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @ApiProperty({ example: 'prod-1' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  variationId?: string;

  @IsOptional() @IsString() size?: string;
  @IsOptional() @IsString() colour?: string;
}

class CheckoutCustomerDto {
  @IsString() name: string;
  @IsString() phone: string;
  @IsEmail() email: string;
}

class DeliveryAddressDto {
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() suburb?: string;
  @IsOptional() @IsString() landmark?: string;
  @IsOptional() @IsString() instructions?: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'cus-1' })
  @IsOptional() @IsString() customerId?: string;

  @IsOptional() @ValidateNested() @Type(() => CheckoutCustomerDto) customer?: CheckoutCustomerDto;

  @ApiProperty({ example: 420, required: false, description: 'Ignored; totals are calculated from server-side prices.' })
  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({ example: 'EcoCash' })
  @IsString()
  paymentMethod: string;

  @IsOptional() @IsString() fulfilmentMethod?: string;
  @IsOptional() @ValidateNested() @Type(() => DeliveryAddressDto) deliveryAddress?: DeliveryAddressDto;
  @IsOptional() @IsString() orderNotes?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
