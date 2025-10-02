import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { EmailConfiguration, Prisma } from '@prisma/client';
import {
  CreateEmailConfigDto,
  UpdateEmailConfigDto,
  TestEmailConnectionDto,
} from './email-config.validator.dto';
import * as CryptoJS from 'crypto-js';
import * as nodemailer from 'nodemailer';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Pop3Command = require('node-pop3');
import * as Imap from 'imap';

@Injectable()
export class EmailConfigService {
  @Inject() private prisma: PrismaService;
  @Inject() private utilityService: UtilityService;

  private encryptionKey: string;

  constructor() {
    this.encryptionKey =
      process.env.EMAIL_ENCRYPTION_KEY || 'default-encryption-key-change-this';
  }

  private encryptPassword(password: string): string {
    return CryptoJS.AES.encrypt(password, this.encryptionKey).toString();
  }

  private decryptPassword(encryptedPassword: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  async getEmailConfiguration(
    accountId: string,
  ): Promise<EmailConfiguration | null> {
    const config = await this.prisma.emailConfiguration.findUnique({
      where: { accountId },
    });

    if (config) {
      // Don't send the encrypted password to frontend
      return { ...config, emailPassword: '' };
    }

    return null;
  }

  async createEmailConfiguration(
    accountId: string,
    dto: CreateEmailConfigDto,
  ): Promise<EmailConfiguration> {
    // Check if configuration already exists
    const existing = await this.prisma.emailConfiguration.findUnique({
      where: { accountId },
    });

    if (existing) {
      throw new BadRequestException(
        'Email configuration already exists for this account',
      );
    }

    // Encrypt the password before storing
    const encryptedPassword = this.encryptPassword(dto.emailPassword);

    const emailConfig = await this.prisma.emailConfiguration.create({
      data: {
        accountId,
        ...dto,
        emailPassword: encryptedPassword,
      },
    });

    // Return without password
    return { ...emailConfig, emailPassword: '' };
  }

  async updateEmailConfiguration(
    accountId: string,
    dto: UpdateEmailConfigDto,
  ): Promise<EmailConfiguration> {
    const existing = await this.prisma.emailConfiguration.findUnique({
      where: { accountId },
    });

    if (!existing) {
      throw new NotFoundException('Email configuration not found');
    }

    // If password is provided, encrypt it
    const updateData: Prisma.EmailConfigurationUpdateInput = { ...dto };
    if (dto.emailPassword && dto.emailPassword !== '') {
      updateData.emailPassword = this.encryptPassword(dto.emailPassword);
    } else {
      // If no password provided, keep the existing one
      delete updateData.emailPassword;
    }

    const updated = await this.prisma.emailConfiguration.update({
      where: { accountId },
      data: updateData,
    });

    // Return without password
    return { ...updated, emailPassword: '' };
  }

  async deleteEmailConfiguration(accountId: string): Promise<void> {
    const existing = await this.prisma.emailConfiguration.findUnique({
      where: { accountId },
    });

    if (!existing) {
      throw new NotFoundException('Email configuration not found');
    }

    await this.prisma.emailConfiguration.delete({
      where: { accountId },
    });
  }

  async testEmailConnection(dto: TestEmailConnectionDto): Promise<{
    success: boolean;
    message: string;
    details?: {
      incoming: { success: boolean; message: string };
      outgoing: { success: boolean; message: string };
    };
  }> {
    const results = {
      incoming: { success: false, message: '' },
      outgoing: { success: false, message: '' },
    };

    // Test incoming connection (POP3/IMAP)
    try {
      if (dto.emailProtocol === 'IMAP') {
        results.incoming = await this.testImapConnection(dto);
      } else if (dto.emailProtocol === 'POP3') {
        results.incoming = await this.testPop3Connection(dto);
      }
    } catch (error) {
      results.incoming = {
        success: false,
        message: `Incoming server error: ${error.message}`,
      };
    }

    // Test outgoing connection (SMTP)
    try {
      results.outgoing = await this.testSmtpConnection(dto);
    } catch (error) {
      results.outgoing = {
        success: false,
        message: `Outgoing server error: ${error.message}`,
      };
    }

    const allSuccess = results.incoming.success && results.outgoing.success;

    return {
      success: allSuccess,
      message: allSuccess
        ? 'Both incoming and outgoing connections successful'
        : 'Connection test failed',
      details: results,
    };
  }

  private async testImapConnection(
    dto: TestEmailConnectionDto,
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const imap = new Imap({
        user: dto.emailAddress,
        password: dto.emailPassword,
        host: dto.incomingServer,
        port: dto.incomingPort,
        tls: dto.incomingSSL,
        tlsOptions: { rejectUnauthorized: false },
      });

      imap.once('ready', () => {
        imap.end();
        resolve({ success: true, message: 'IMAP connection successful' });
      });

      imap.once('error', (err: Error) => {
        resolve({ success: false, message: `IMAP error: ${err.message}` });
      });

      imap.connect();
    });
  }

  private async testPop3Connection(
    dto: TestEmailConnectionDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const pop3 = new Pop3Command({
        user: dto.emailAddress,
        password: dto.emailPassword,
        host: dto.incomingServer,
        port: dto.incomingPort,
        tls: dto.incomingSSL,
      });

      await pop3.connect();
      await pop3.QUIT();

      return { success: true, message: 'POP3 connection successful' };
    } catch (error) {
      return { success: false, message: `POP3 error: ${error.message}` };
    }
  }

  private async testSmtpConnection(
    dto: TestEmailConnectionDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const transporter = nodemailer.createTransport({
        host: dto.outgoingServer,
        port: dto.outgoingPort,
        secure: dto.outgoingPort === 465, // true for 465, false for other ports
        auth: {
          user: dto.emailAddress,
          pass: dto.emailPassword,
        },
        tls: {
          rejectUnauthorized: false, // Accept self-signed certificates
        },
      });

      // Verify SMTP connection
      await transporter.verify();

      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      return { success: false, message: `SMTP error: ${error.message}` };
    }
  }

  async getDecryptedConfiguration(
    accountId: string,
  ): Promise<EmailConfiguration | null> {
    const config = await this.prisma.emailConfiguration.findUnique({
      where: { accountId },
    });

    if (config) {
      return {
        ...config,
        emailPassword: this.decryptPassword(config.emailPassword),
      };
    }

    return null;
  }

  async testSavedConnection(accountId: string): Promise<{
    success: boolean;
    message: string;
    details?: {
      incoming: { success: boolean; message: string };
      outgoing: { success: boolean; message: string };
    };
  }> {
    // Get the saved configuration with decrypted password
    const config = await this.getDecryptedConfiguration(accountId);

    if (!config) {
      return {
        success: false,
        message:
          'No email configuration found. Please configure your email settings first.',
      };
    }

    if (!config.isActive) {
      return {
        success: false,
        message:
          'Email configuration is inactive. Please activate it in settings.',
      };
    }

    // Create a test DTO from the saved configuration
    const testDto: TestEmailConnectionDto = {
      emailProvider: config.emailProvider,
      emailProtocol: config.emailProtocol,
      incomingServer: config.incomingServer,
      incomingPort: config.incomingPort,
      incomingSSL: config.incomingSSL,
      outgoingServer: config.outgoingServer,
      outgoingPort: config.outgoingPort,
      outgoingSSL: config.outgoingSSL,
      emailAddress: config.emailAddress,
      emailPassword: config.emailPassword,
    };

    // Use the existing test method
    return this.testEmailConnection(testDto);
  }

  // Helper method to get email server presets
  getEmailProviderPresets(provider: string) {
    const presets = {
      GMAIL: {
        incomingServer: 'imap.gmail.com',
        incomingPort: 993,
        incomingSSL: true,
        outgoingServer: 'smtp.gmail.com',
        outgoingPort: 587,
        outgoingSSL: true,
      },
      OUTLOOK: {
        incomingServer: 'outlook.office365.com',
        incomingPort: 993,
        incomingSSL: true,
        outgoingServer: 'smtp.office365.com',
        outgoingPort: 587,
        outgoingSSL: true,
      },
      YAHOO: {
        incomingServer: 'imap.mail.yahoo.com',
        incomingPort: 993,
        incomingSSL: true,
        outgoingServer: 'smtp.mail.yahoo.com',
        outgoingPort: 587,
        outgoingSSL: true,
      },
    };

    return presets[provider] || null;
  }
}
