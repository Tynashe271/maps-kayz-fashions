import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendOrderMessageDto {
  @ApiProperty({ example: 'Jane Moyo' })
  @IsString()
  customerName: string;

  @ApiProperty({ example: 'Classic Black Formal Dress' })
  @IsString()
  productName: string;

  @ApiProperty({ example: 'MK-BLACK-001' })
  @IsString()
  sku: string;
}
