import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Women Fashion' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'women-fashion' })
  @IsString()
  slug: string;

  @ApiProperty({ example: null, required: false })
  @IsOptional()
  @IsString()
  parentId?: string | null;
}
