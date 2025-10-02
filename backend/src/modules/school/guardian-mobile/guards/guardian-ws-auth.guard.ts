import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

@Injectable()
export class GuardianWsAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromSocket(client);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('GUARDIAN_JWT_SECRET'),
      });

      // Verify it's a guardian token
      if (payload.type !== 'guardian') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Attach guardian info to socket
      client.data.guardianId = payload.sub;
      client.data.email = payload.email;
      client.data.type = 'guardian';

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromSocket(client: Socket): string | undefined {
    // Check auth object first (socket.io-client v3+)
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }

    // Check headers
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check query params (legacy)
    if (client.handshake.query?.token) {
      return client.handshake.query.token as string;
    }

    return undefined;
  }
}
