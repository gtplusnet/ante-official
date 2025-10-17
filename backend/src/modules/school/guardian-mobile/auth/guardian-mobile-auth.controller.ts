import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Ip,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { GuardianMobileAuthService } from './guardian-mobile-auth.service';
import { GuardianAuthGuard } from './guardian-mobile-auth.guard';
import {
  GuardianLoginDto,
  GuardianRegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyOtpDto,
  ChangePasswordDto,
  LogoutDto,
} from './guardian-mobile-auth.dto';

@Controller('api/guardian/auth')
export class GuardianMobileAuthController {
  @Post('test')
  @HttpCode(HttpStatus.OK)
  async test() {
    return { message: 'Guardian auth endpoint is reachable!' };
  }
  constructor(private readonly authService: GuardianMobileAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: GuardianLoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const result = await this.authService.login(dto, ip, userAgent);
    return {
      success: true,
      data: result,
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: GuardianRegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const result = await this.authService.register(dto, ip, userAgent);
    return {
      success: true,
      data: result,
    };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('logout')
  @UseGuards(GuardianAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request & { user: any }, @Body() dto: LogoutDto) {
    await this.authService.logout(req.user.id, dto);
    return { message: 'Logged out successfully' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('change-password')
  @UseGuards(GuardianAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: Request & { user: any },
    @Body() dto: ChangePasswordDto,
  ) {
    const result = await this.authService.changePassword(req.user.id, dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('profile')
  @UseGuards(GuardianAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: Request & { user: any }) {
    const profile = await this.authService.getProfile(req.user.id);
    return {
      success: true,
      data: {
        guardian: profile.guardian,
        company: profile.company,
      },
    };
  }
}
