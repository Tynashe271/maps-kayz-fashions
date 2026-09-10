import { IsBoolean, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePlatformRecordDto {
  @IsString()
  @MinLength(1)
  reference: string;

  @IsObject()
  data: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdatePlatformRecordDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  reference?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
