import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class PaymentProofDto {
  @ApiProperty({ example: 'jane@example.com', description: "Must match the email on the order's customer record." })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'ZB240915001', required: false, description: 'Bank/EcoCash/Paynow transaction reference, if the customer has one.' })
  @IsOptional() @IsString() @MaxLength(120)
  reference?: string;

  @ApiProperty({ required: false, description: 'Free-text note from the customer about how/when they paid.' })
  @IsOptional() @IsString() @MaxLength(500)
  note?: string;
}
