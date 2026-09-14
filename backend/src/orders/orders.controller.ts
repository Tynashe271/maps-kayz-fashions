import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto, OrderLookupDto, CreateReturnRequestDto, OrderEmailQueryDto, PaymentProofDto, CancelOrderDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StaffGuard } from '../auth/staff.guard';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, StaffGuard)
  @ApiOperation({ summary: 'List orders' })
  findAll() {
    return this.ordersService.findAll();
  }

  // Declared before ':id' so it isn't swallowed by that param route.
  @Get('track')
  @ApiOperation({ summary: 'Look up an order by order number and email (public order tracking)' })
  track(@Query() query: OrderLookupDto) {
    return this.ordersService.lookupOrder(query);
  }

  @Post(':id/returns')
  @ApiOperation({ summary: 'Request a return for an order (customer self-service, email-verified)' })
  requestReturn(@Param('id') id: string, @Body() dto: CreateReturnRequestDto) {
    return this.ordersService.requestReturn(id, dto);
  }

  // Order-number-scoped routes below back the website → WhatsApp → payment
  // workflow (checkout has already created the order by the time any of
  // these run). Two segments long, so none of them collide with ':id' above.

  @Get('by-number/:orderNumber')
  @ApiOperation({ summary: "Look up an order by order number and email (public; backs the payment page)" })
  findByOrderNumber(@Param('orderNumber') orderNumber: string, @Query() query: OrderEmailQueryDto) {
    return this.ordersService.lookupByOrderNumber(orderNumber, query.email);
  }

  @Get(':orderNumber/receipt')
  @ApiOperation({ summary: 'Get a receipt for an order (public; email-verified)' })
  getReceipt(@Param('orderNumber') orderNumber: string, @Query() query: OrderEmailQueryDto) {
    return this.ordersService.getReceipt(orderNumber, query.email);
  }

  @Post(':orderNumber/payment-proof')
  @ApiOperation({ summary: 'Submit a manual EFT/ZIPIT payment proof/reference for an order (email-verified)' })
  submitPaymentProof(@Param('orderNumber') orderNumber: string, @Body() dto: PaymentProofDto) {
    return this.ordersService.submitPaymentProof(orderNumber, dto);
  }

  @Post(':orderNumber/cancel')
  @ApiOperation({ summary: 'Cancel an unpaid order (customer self-service, email-verified)' })
  cancel(@Param('orderNumber') orderNumber: string, @Body() dto: CancelOrderDto) {
    return this.ordersService.cancelByOrderNumber(orderNumber, dto.email);
  }

  @Post(':orderNumber/whatsapp-link')
  @UseGuards(JwtAuthGuard, StaffGuard)
  @ApiOperation({ summary: 'Regenerate the WhatsApp order-summary link ("Resend WhatsApp summary")' })
  regenerateWhatsAppLink(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.regenerateWhatsAppLink(orderNumber);
  }

  @Post(':orderNumber/payment-link')
  @UseGuards(JwtAuthGuard, StaffGuard)
  @ApiOperation({ summary: 'Regenerate the secure payment link for an order' })
  regeneratePaymentLink(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.regeneratePaymentLink(orderNumber);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, StaffGuard)
  @ApiOperation({ summary: 'Get order by id' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create order' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, StaffGuard)
  @ApiOperation({ summary: 'Update order status' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }
}
