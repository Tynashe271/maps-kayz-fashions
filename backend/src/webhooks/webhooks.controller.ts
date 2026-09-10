import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { PaymentWebhookDto, WhatsAppWebhookDto } from './dto';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('payment')
  @ApiOperation({ summary: 'Payment provider webhook — verifies and records a payment result' })
  payment(@Headers('x-webhook-secret') secret: string, @Body() dto: PaymentWebhookDto) {
    return this.webhooksService.handlePayment(secret, dto);
  }

  @Post('whatsapp')
  @ApiOperation({ summary: 'WhatsApp Business Platform webhook — matches a message to an order' })
  whatsapp(@Headers('x-webhook-secret') secret: string, @Body() dto: WhatsAppWebhookDto) {
    return this.webhooksService.handleWhatsApp(secret, dto);
  }
}
