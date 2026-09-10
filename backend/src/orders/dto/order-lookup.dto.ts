import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class OrderLookupDto {
  @ApiProperty({ example: 'MK-1757412345678-0001' })
  @IsString()
  orderNumber: string;

  @ApiProperty({ example: 'jane@example.com', description: "Must match the email on the order's customer record." })
  @IsEmail()
  email: string;
}
