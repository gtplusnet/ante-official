import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { EmailService } from '@modules/communication/email/email.service';
import { Account } from '@prisma/client';
import { AccountDataResponse } from '@shared/response/account.response';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utility: UtilityService,
    private readonly emailService: EmailService,
  ) {}

  async generateVerificationToken(accountId: string): Promise<string> {
    const token = this.utility.randomString();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24); // 24 hour expiry

    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        emailVerificationToken: token,
        emailVerificationExpiry: expiry,
      },
    });

    return token;
  }

  async sendVerificationEmail(
    account: Account,
    companyName: string,
  ): Promise<void> {
    const token = await this.generateVerificationToken(account.id);
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:9000'}/#/verify-email/${token}`;

    const emailContent = {
      to: account.email,
      subject: 'Verify your email address - GEER-ANTE ERP',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #2F40C4;
              margin: 0;
              font-size: 28px;
            }
            .content {
              margin-bottom: 30px;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .verify-button {
              display: inline-block;
              background-color: #2F40C4;
              color: #ffffff;
              text-decoration: none;
              padding: 14px 30px;
              border-radius: 5px;
              font-weight: bold;
              font-size: 16px;
            }
            .verify-button:hover {
              background-color: #1e2d8f;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            .company-info {
              color: #666;
              font-size: 14px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>GEER-ANTE ERP</h1>
              <p>Email Verification</p>
            </div>
            
            <div class="content">
              <p>Hello ${account.firstName} ${account.lastName},</p>
              
              <p>Welcome to GEER-ANTE ERP! Thank you for signing up with <strong>${companyName}</strong>.</p>
              
              <p>To complete your registration and ensure the security of your account, please verify your email address by clicking the button below:</p>
              
              <div class="button-container">
                <a href="${verificationUrl}" class="verify-button">Verify Email Address</a>
              </div>
              
              <div class="company-info">
                <p><strong>Important:</strong></p>
                <ul>
                  <li>This verification link will expire in 24 hours</li>
                  <li>You can still access your account without verification, but some features may be limited</li>
                  <li>If you didn't create this account, please ignore this email</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated message from GEER-ANTE ERP. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} GEER-ANTE ERP. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      // Use system account ID for sending emails (you might want to configure this)
      const systemAccountId = account.id; // For now, use the user's own account

      await this.emailService.sendEmail(systemAccountId, emailContent, {
        module: 'USER_MANAGEMENT',
        moduleContext: 'CONFIRMATION',
        metadata: {
          accountId: account.id,
          verificationType: 'email',
        },
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't throw error - we don't want signup to fail if email fails
      this.utility.log(
        `Failed to send verification email to ${account.email}: ${error.message}`,
      );
    }
  }

  async verifyEmail(token: string): Promise<AccountDataResponse> {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const account = await this.prisma.account.findFirst({
      where: {
        emailVerificationToken: token,
        isEmailVerified: false,
      },
      include: {
        role: true,
        company: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    // Check if token has expired
    if (
      account.emailVerificationExpiry &&
      new Date() > account.emailVerificationExpiry
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    // Update account to verified
    const updatedAccount = await this.prisma.account.update({
      where: { id: account.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
      include: {
        role: true,
        company: true,
      },
    });

    this.utility.log(`Email verified successfully for ${account.email}`);

    // Return account data in the expected format
    return {
      id: updatedAccount.id,
      email: updatedAccount.email,
      firstName: updatedAccount.firstName,
      lastName: updatedAccount.lastName,
      middleName: updatedAccount.middleName,
      contactNumber: updatedAccount.contactNumber,
      username: updatedAccount.username,
      parentAccountId: updatedAccount.parentAccountId,
      status: updatedAccount.status,
      accountType: updatedAccount.accountType,
      roleID: updatedAccount.roleId,
      role: updatedAccount.role as any,
      company: updatedAccount.company as any,
      isDeveloper: updatedAccount.isDeveloper,
      image: updatedAccount.image,
      pettyCashAmount: updatedAccount.pettyCashAmount,
      isEmailVerified: updatedAccount.isEmailVerified,
      createdAt: this.utility.formatDate(updatedAccount.createdAt),
      updatedAt: this.utility.formatDate(updatedAccount.updatedAt),
    } as AccountDataResponse;
  }

  async resendVerificationEmail(accountId: string): Promise<void> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { company: true },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Check if we should rate limit (don't allow resend within 5 minutes)
    if (account.emailVerificationExpiry) {
      const timeSinceLastSent =
        new Date().getTime() -
        new Date(account.emailVerificationExpiry).getTime() +
        24 * 60 * 60 * 1000;
      if (timeSinceLastSent < 5 * 60 * 1000) {
        // 5 minutes
        throw new BadRequestException(
          'Please wait 5 minutes before requesting another verification email',
        );
      }
    }

    await this.sendVerificationEmail(
      account,
      account.company?.companyName || 'GEER-ANTE',
    );
  }
}
