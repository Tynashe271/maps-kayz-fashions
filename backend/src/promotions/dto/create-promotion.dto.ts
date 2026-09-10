import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreatePromotionDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'percentage' })
  @IsString()
  type: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  value: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  active: boolean;
}
