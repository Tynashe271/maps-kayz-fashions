import { Controller, Sse } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly sync: SyncService) {}
  @Sse('events') events() { return this.sync.stream(); }
}
