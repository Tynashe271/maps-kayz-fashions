import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateReturnRequestDto {
  @ApiProperty({ example: 'jane@example.com', description: "Must match the email on the order's customer record." })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Wrong size' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'Would like a size up if possible.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
