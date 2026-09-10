import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { SendOrderMessageDto } from './dto';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Post('order-message')
  @ApiOperation({ summary: 'Send WhatsApp order message' })
  sendOrderMessage(@Body() dto: SendOrderMessageDto) {
    return this.whatsAppService.sendOrderMessage(dto);
  }
}
