import { Injectable } from '@nestjs/common';
import { Subject, interval, map, merge, of } from 'rxjs';

export type SyncEvent = { type: string; resource: string; action: 'created'|'updated'|'deleted'; id?: string; at: string };

@Injectable()
export class SyncService {
  private readonly changes = new Subject<{ data: SyncEvent }>();
  emit(event: Omit<SyncEvent, 'at'>) { this.changes.next({ data: { ...event, at: new Date().toISOString() } }); }
  stream() { return merge(of({ data: { type: 'connected', resource: 'system', action: 'updated' as const, at: new Date().toISOString() } }), this.changes.asObservable(), interval(20000).pipe(map(() => ({ data: { type: 'heartbeat', resource: 'system', action: 'updated' as const, at: new Date().toISOString() } })))); }
}
