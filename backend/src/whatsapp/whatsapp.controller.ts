import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { WhatsAppService } from './whatsapp.service';
import { SendOrderMessageDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StaffGuard } from '../auth/staff.guard';

class SendTestMessageDto {
  @IsString()
  to: string;

  @IsString()
  message: string;
}

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Post('order-message')
  @ApiOperation({ summary: 'Send WhatsApp order message' })
  sendOrderMessage(@Body() dto: SendOrderMessageDto) {
    return this.whatsAppService.sendOrderMessage(dto);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, StaffGuard)
  @ApiOperation({ summary: 'Whether the WhatsApp Business Cloud API (real, server-sent messages) is configured' })
  status() {
    return { cloudApiConfigured: this.whatsAppService.isCloudApiConfigured() };
  }

  @Post('test-message')
  @UseGuards(JwtAuthGuard, StaffGuard)
  @ApiOperation({ summary: 'Send a real WhatsApp message via the Cloud API — used to verify configuration' })
  sendTestMessage(@Body() dto: SendTestMessageDto) {
    return this.whatsAppService.sendCloudApiMessage(dto.to, dto.message);
  }
}
