import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedRequest } from './jwt-auth.guard';

const STAFF_ROLES = new Set(['super_admin', 'owner', 'manager', 'staff']);

@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user || !STAFF_ROLES.has(request.user.role)) {
      throw new ForbiddenException('Staff access required');
    }
    return true;
  }
}
