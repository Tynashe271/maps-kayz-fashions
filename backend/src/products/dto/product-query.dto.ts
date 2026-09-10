import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ProductQueryDto {
  @ApiPropertyOptional({ example: 'women-formal' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'dress' })
  @IsOptional()
  @IsString()
  search?: string;
}
