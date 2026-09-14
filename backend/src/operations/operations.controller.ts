import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import {
  AdjustStockDto,
  CreateDeliveryDto,
  CreateReturnDto,
  UpdateDeliveryDto,
  UpdateReturnDto,
} from './dto/operations.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StaffGuard } from '../auth/staff.guard';

@ApiTags('operations')
@Controller('operations')
@UseGuards(JwtAuthGuard, StaffGuard)
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get('inventory')
  listInventory(@Query('branchId') branchId?: string) { return this.operations.listInventory(branchId); }

  @Post('inventory/adjust')
  adjustStock(@Body() dto: AdjustStockDto) { return this.operations.adjustStock(dto); }

  @Get('inventory/movements')
  listMovements(@Query('productId') productId?: string) { return this.operations.listStockMovements(productId); }

  @Get('inventory/low-stock')
  listLowStock() { return this.operations.listLowStock(); }

  @Get('deliveries')
  listDeliveries() { return this.operations.listDeliveries(); }

  @Post('deliveries')
  createDelivery(@Body() dto: CreateDeliveryDto) { return this.operations.createDelivery(dto); }

  @Patch('deliveries/:id')
  updateDelivery(@Param('id') id: string, @Body() dto: UpdateDeliveryDto) { return this.operations.updateDelivery(id, dto); }

  @Get('returns')
  listReturns() { return this.operations.listReturns(); }

  @Post('returns')
  createReturn(@Body() dto: CreateReturnDto) { return this.operations.createReturn(dto); }

  @Patch('returns/:id')
  updateReturn(@Param('id') id: string, @Body() dto: UpdateReturnDto) { return this.operations.updateReturn(id, dto); }
}
