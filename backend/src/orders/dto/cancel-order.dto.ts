import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ example: 'jane@example.com', description: "Must match the email on the order's customer record." })
  @IsEmail()
  email: string;
}
