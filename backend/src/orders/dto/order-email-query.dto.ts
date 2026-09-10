import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

// Same "order number + the email on the order" capability check used by
// OrderLookupDto — the payment page and other customer self-service actions
// authenticate this way rather than requiring a logged-in shopper account.
export class OrderEmailQueryDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;
}
