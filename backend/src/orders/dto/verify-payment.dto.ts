import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ required: false, example: 'ZB240915001', description: 'Transaction reference the admin checked against the business bank/merchant account.' })
  @IsOptional() @IsString() @MaxLength(120)
  reference?: string;
}
