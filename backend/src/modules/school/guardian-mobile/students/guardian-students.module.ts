import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GuardianStudentsController } from './guardian-students.controller';
import { GuardianStudentsService } from './guardian-students.service';
import { PrismaService } from '@common/prisma.service';
import { GuardianMobileAuthModule } from '../auth/guardian-mobile-auth.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(
          'GUARDIAN_JWT_SECRET',
          'guardian-default-secret',
        ),
        signOptions: {
          expiresIn: configService.get<string>('GUARDIAN_JWT_EXPIRY', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    GuardianMobileAuthModule,
  ],
  controllers: [GuardianStudentsController],
  providers: [GuardianStudentsService, PrismaService],
  exports: [GuardianStudentsService],
})
export class GuardianStudentsModule {}
