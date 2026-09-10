import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: { id: string; email: string; role: string };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const value = Array.isArray(authorization) ? authorization[0] : authorization;
    if (!value?.startsWith('Bearer ')) throw new UnauthorizedException('Bearer token required');
    const [header, payload, signature] = value.slice(7).split('.');
    if (!header || !payload || !signature) throw new UnauthorizedException('Invalid access token');

    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new UnauthorizedException('Authentication is not configured');
    const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest();
    let supplied: Buffer;
    try { supplied = Buffer.from(signature, 'base64url'); } catch { throw new UnauthorizedException('Invalid access token'); }
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      throw new UnauthorizedException('Invalid access token');
    }
    try {
      const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (!claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) throw new Error('expired');
      request.user = { id: claims.id, email: claims.email, role: claims.role };
      return true;
    } catch {
      throw new UnauthorizedException('Expired or invalid access token');
    }
  }
}
