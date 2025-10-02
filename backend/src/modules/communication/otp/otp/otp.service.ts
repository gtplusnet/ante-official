import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TelegramService } from '@modules/communication/telegram/telegram/telegram.service';
import { randomInt } from 'crypto';

@Injectable()
export class OTPService {
  @Inject() private prisma: PrismaService;
  @Inject() private utility: UtilityService;
  @Inject() private telegramService: TelegramService;

  private generateOTP(): string {
    return randomInt(100000, 999999).toString();
  }

  async generateDeveloperPromotionOTP(accountId: string): Promise<void> {
    const otp = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

    // Create OTP record
    await this.prisma.oTPVerification.create({
      data: {
        accountId,
        otp,
        type: 'DEVELOPER_PROMOTION',
        expiresAt,
      },
    });

    // Get account details
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { company: true },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Send OTP via Telegram
    const message = `
🔐 <b>Developer Account Promotion OTP</b>

Company: ${account.company?.companyName || 'N/A'}
Account: ${account.firstName} ${account.lastName}
Email: ${account.email}

Your OTP is: <code>${otp}</code>

This OTP will expire in 10 minutes.
    `;

    await this.telegramService.sendMessage(message);
  }

  async verifyDeveloperPromotionOTP(
    accountId: string,
    otp: string,
  ): Promise<boolean> {
    const verification = await this.prisma.oTPVerification.findFirst({
      where: {
        accountId,
        otp,
        type: 'DEVELOPER_PROMOTION',
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verification) {
      return false;
    }

    // Mark OTP as verified
    await this.prisma.oTPVerification.update({
      where: { id: verification.id },
      data: { status: 'VERIFIED' },
    });

    await this.prisma.account.update({
      where: { id: accountId },
      data: { isDeveloper: true },
    });

    return true;
  }

  async generateGenericOTP(accountId: string, type: string): Promise<void> {
    const otp = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

    // Create OTP record
    await this.prisma.oTPVerification.create({
      data: {
        accountId,
        otp,
        type,
        expiresAt,
      },
    });

    // Get account details
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { company: true },
    });
    if (!account) {
      throw new Error('Account not found');
    }

    // Compose message based on type/context
    let message = '';
    if (type === 'DEVELOPER_SCRIPT') {
      message = `\n🔐 <b>Developer Script Execution OTP</b>\n\nCompany: ${account.company?.companyName || 'N/A'}\nAccount: ${account.firstName} ${account.lastName}\nEmail: ${account.email}\n\nYour OTP is: <code>${otp}</code>\n\nThis OTP will expire in 10 minutes.`;
    } else {
      message = `\n🔐 <b>OTP for ${type}</b>\n\nCompany: ${account.company?.companyName || 'N/A'}\nAccount: ${account.firstName} ${account.lastName}\nEmail: ${account.email}\n\nYour OTP is: <code>${otp}</code>\n\nThis OTP will expire in 10 minutes.`;
    }
    await this.telegramService.sendMessage(message);
  }

  async verifyGenericOTP(
    accountId: string,
    type: string,
    otp: string,
  ): Promise<boolean> {
    const verification = await this.prisma.oTPVerification.findFirst({
      where: {
        accountId,
        otp,
        type,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
    });
    if (!verification) {
      return false;
    }
    // Mark OTP as verified
    await this.prisma.oTPVerification.update({
      where: { id: verification.id },
      data: { status: 'VERIFIED' },
    });
    return true;
  }
}
