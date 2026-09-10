import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePlatformRecordDto, UpdatePlatformRecordDto } from './dto/platform-record.dto';
import { PlatformService } from './platform.service';
import { PLATFORM_CAPABILITIES } from './platform-capabilities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StaffGuard } from '../auth/staff.guard';

@ApiTags('platform')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('summary')
  summary() { return this.platform.summary(); }

  @Get('capabilities')
  capabilities() { return PLATFORM_CAPABILITIES; }

  @Get(':resource')
  list(@Param('resource') resource: string) { return this.platform.list(resource); }

  @Get(':resource/:id')
  findOne(@Param('resource') resource: string, @Param('id') id: string) { return this.platform.findOne(resource, id); }

  @Post(':resource')
  @UseGuards(JwtAuthGuard, StaffGuard)
  create(@Param('resource') resource: string, @Body() dto: CreatePlatformRecordDto) { return this.platform.create(resource, dto); }

  @Patch(':resource/:id')
  @UseGuards(JwtAuthGuard, StaffGuard)
  update(@Param('resource') resource: string, @Param('id') id: string, @Body() dto: UpdatePlatformRecordDto) { return this.platform.update(resource, id, dto); }

  @Delete(':resource/:id')
  @UseGuards(JwtAuthGuard, StaffGuard)
  remove(@Param('resource') resource: string, @Param('id') id: string) { return this.platform.remove(resource, id); }
}
