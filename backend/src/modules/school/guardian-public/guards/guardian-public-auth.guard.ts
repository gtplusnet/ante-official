import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SchoolGuardianPublicService } from '../school-guardian-public.service';

@Injectable()
export class GuardianPublicAuthGuard implements CanActivate {
  constructor(
    private readonly guardianService: SchoolGuardianPublicService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    try {
      // Validate token and get guardian
      const guardian = await this.guardianService.validateToken(token);

      if (!guardian) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Attach guardian to request
      request.user = guardian;
      request.guardianId = guardian.id;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}