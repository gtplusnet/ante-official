import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GuardianAttendanceController } from './guardian-attendance.controller';
import { GuardianAttendanceService } from './guardian-attendance.service';
import { GuardianAttendanceGateway } from './guardian-attendance.gateway';
import { GuardianWsAuthGuard } from '../guards/guardian-ws-auth.guard';
import { PrismaService } from '@common/prisma.service';

@Module({
  imports: [
    CommonModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('GUARDIAN_JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [GuardianAttendanceController],
  providers: [
    GuardianAttendanceService,
    GuardianAttendanceGateway,
    GuardianWsAuthGuard,
    PrismaService,
  ],
  exports: [GuardianAttendanceService, GuardianAttendanceGateway],
})
export class GuardianAttendanceModule {}
