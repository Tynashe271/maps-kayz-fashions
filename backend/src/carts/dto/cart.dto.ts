import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPhoneNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateCartDto {
  @ApiPropertyOptional({ example: 'Jane Moyo' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: '+263771234567' })
  @IsOptional()
  @IsPhoneNumber()
  customerPhone?: string;
}

export class AddCartItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'M' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 'Black' })
  @IsOptional()
  @IsString()
  colour?: string;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class SendCartWhatsAppDto {
  @ApiPropertyOptional({ example: 'Jane Moyo' })
  @IsOptional()
  @IsString()
  customerName?: string;
}
