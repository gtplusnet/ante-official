import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '@common/prisma.service';

@Injectable()
export class GuardianAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    console.log('GuardianAuthGuard - Token:', token ? 'Present' : 'Missing');

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          'GUARDIAN_JWT_SECRET',
          'guardian-default-secret',
        ),
      });

      // Check if token exists in database and is not revoked
      const tokenRecord = await this.prisma.guardianToken.findFirst({
        where: {
          token,
          guardianId: payload.sub,
          isRevoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid token');
      }

      // Get guardian information
      const guardian = await this.prisma.guardian.findFirst({
        where: {
          id: payload.sub,
          isActive: true,
          isDeleted: false,
        },
        include: {
          company: {
            select: {
              id: true,
              companyName: true,
            },
          },
          students: {
            include: {
              student: {
                select: {
                  id: true,
                  studentNumber: true,
                  firstName: true,
                  lastName: true,
                  middleName: true,
                },
              },
            },
          },
        },
      });

      if (!guardian) {
        throw new UnauthorizedException('Guardian not found');
      }

      // Attach guardian to request (as 'user' for consistency with controllers)
      (request as any).user = {
        id: guardian.id,
        email: guardian.email,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        middleName: guardian.middleName,
        contactNumber: guardian.contactNumber,
        companyId: guardian.companyId,
        company: guardian.company,
        students: guardian.students.map((sg) => ({
          ...sg.student,
          relationship: sg.relationship,
          isPrimary: sg.isPrimary,
        })),
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
