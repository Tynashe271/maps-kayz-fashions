import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Maps Kayz Fashions API is running.';
  }
}
