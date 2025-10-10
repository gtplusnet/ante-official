import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { InviteService } from './invite.service';
import { GoogleAuthService } from './google-auth.service';
import { FacebookAuthService } from './facebook-auth.service';
import { AuthEnhancedService } from './auth-enhanced.service';
import { AuthCompatibilityService } from '../../migration/utils/auth-compatibility.service';
import { EmailModule } from '@modules/communication/email/email.module';
import { CommonModule } from '@common/common.module';
import { AccountModule } from '@modules/account/account/account.module';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    EmailModule,
    forwardRef(() => AccountModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailVerificationService,
    InviteService,
    GoogleAuthService,
    FacebookAuthService,
    AuthEnhancedService,
    AuthCompatibilityService,
  ],
  exports: [
    AuthService,
    EmailVerificationService,
    InviteService,
    GoogleAuthService,
    FacebookAuthService,
    AuthEnhancedService,
    AuthCompatibilityService,
  ],
})
export class AuthModule {}
