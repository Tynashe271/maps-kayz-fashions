import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { OrdersService } from '../orders/orders.service';
import { AdminOrdersQueryDto, UpdateOrderDto, VerifyPaymentDto } from '../orders/dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StaffGuard } from '../auth/staff.guard';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, StaffGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // WhatsApp-commerce order controls (see backend README / ordering-workflow
  // notes) — a human-readable-order-number mirror of the existing staff-only
  // /orders routes, plus payment verification, for the admin app's Orders
  // and Payments sections.

  @Get('orders')
  @ApiOperation({ summary: 'List orders, optionally filtered by status/paymentStatus/whatsappStatus' })
  listOrders(@Query() query: AdminOrdersQueryDto) {
    return this.ordersService.findAllFiltered(query);
  }

  @Patch('orders/:orderNumber/status')
  @ApiOperation({ summary: 'Update an order\'s status by order number' })
  updateOrderStatus(@Param('orderNumber') orderNumber: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.updateStatusByOrderNumber(orderNumber, dto);
  }

  @Post('orders/:orderNumber/verify-payment')
  @ApiOperation({ summary: 'Confirm a manual payment after checking the business bank/merchant account' })
  verifyPayment(@Param('orderNumber') orderNumber: string, @Body() dto: VerifyPaymentDto) {
    return this.ordersService.verifyPayment(orderNumber, dto.reference);
  }

  @Post('orders/:orderNumber/send-receipt')
  @ApiOperation({ summary: 'Resend the WhatsApp receipt for an order' })
  sendReceipt(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.sendReceipt(orderNumber);
  }
}
