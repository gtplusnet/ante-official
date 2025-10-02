import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { OTPService } from './otp.service';
import { UtilityService } from '@common/utility.service';

@Controller('otp')
export class OTPController {
  @Inject() private otpService: OTPService;
  @Inject() private utility: UtilityService;

  @Post('developer-promotion/request')
  async requestDeveloperPromotionOTP() {
    const accountId = this.utility.accountInformation.id;
    await this.otpService.generateDeveloperPromotionOTP(accountId);
    return { message: 'OTP sent successfully' };
  }

  @Post('developer-promotion/verify')
  async verifyDeveloperPromotionOTP(@Body('otp') otp: string) {
    const accountId = this.utility.accountInformation.id;
    const success = await this.otpService.verifyDeveloperPromotionOTP(
      accountId,
      otp,
    );

    if (!success) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    return { message: 'Account successfully promoted to developer' };
  }

  @Post('request')
  async requestGenericOTP(
    @Body('type') type: string,
    @Body('context') _context: any = {},
  ) {
    const accountId = this.utility.accountInformation.id;
    await this.otpService.generateGenericOTP(accountId, type);
    return { message: 'OTP sent successfully' };
  }

  @Post('verify')
  async verifyGenericOTP(
    @Body('type') type: string,
    @Body('otp') otp: string,
    @Body('context') _context: any = {},
  ) {
    const accountId = this.utility.accountInformation.id;
    const success = await this.otpService.verifyGenericOTP(
      accountId,
      type,
      otp,
    );
    if (!success) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    return { message: 'OTP verified successfully' };
  }
}
