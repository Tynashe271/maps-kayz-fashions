import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartsService } from './carts.service';
import { AddCartItemDto, CreateCartDto, SendCartWhatsAppDto, UpdateCartItemDto } from './dto/cart.dto';

@ApiTags('carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly carts: CartsService) {}

  @Post() create(@Body() dto: CreateCartDto) { return this.carts.create(dto); }
  @Get(':id') findOne(@Param('id') id: string) { return this.carts.findOne(id); }
  @Post(':id/items') addItem(@Param('id') id: string, @Body() dto: AddCartItemDto) { return this.carts.addItem(id, dto); }
  @Patch(':id/items/:itemId') updateItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdateCartItemDto) { return this.carts.updateItem(id, itemId, dto); }
  @Delete(':id/items/:itemId') removeItem(@Param('id') id: string, @Param('itemId') itemId: string) { return this.carts.removeItem(id, itemId); }

  @Post(':id/whatsapp')
  @ApiOperation({ summary: 'Prepare this cart for ordering through WhatsApp' })
  sendToWhatsApp(@Param('id') id: string, @Body() dto: SendCartWhatsAppDto) { return this.carts.sendToWhatsApp(id, dto); }
}
