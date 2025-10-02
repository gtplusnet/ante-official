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
import { SupabaseAuthService } from '../supabase-auth/supabase-auth.service';
import { SupabaseTokenManagerService } from '../supabase-auth/supabase-token-manager.service';
import { EmailModule } from '@modules/communication/email/email.module';
import { CommonModule } from '@common/common.module';
import { AccountModule } from '@modules/account/account/account.module';
import { SupabaseModule } from '@infrastructure/supabase/supabase.module';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    EmailModule,
    SupabaseModule,
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
    SupabaseAuthService,
    SupabaseTokenManagerService,
  ],
  exports: [
    AuthService,
    EmailVerificationService,
    InviteService,
    GoogleAuthService,
    FacebookAuthService,
    AuthEnhancedService,
    AuthCompatibilityService,
    SupabaseAuthService,
    SupabaseTokenManagerService,
  ],
})
export class AuthModule {}
