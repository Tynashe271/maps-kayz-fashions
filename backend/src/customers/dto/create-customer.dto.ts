import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Jane Moyo' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+263771234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Bulawayo', required: false })
  @IsOptional()
  @IsString()
  city?: string;
}
