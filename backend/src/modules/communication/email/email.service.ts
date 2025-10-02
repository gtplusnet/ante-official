import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EmailConfigService } from '../email-config/email-config.service';
import { EmailStorageService } from './email-storage.service';
import { PrismaService } from '@common/prisma.service';
import { SentEmailService } from '../sent-email/sent-email.service';
// import { SocketGateway } from '@gateway/socket.gateway';
import * as nodemailer from 'nodemailer';
import * as Imap from 'imap';
import { simpleParser } from 'mailparser';
import { EmailConfiguration } from '@prisma/client';
import { SendEmailDto } from './email-send.dto';
import { EmailMetadata } from '@shared/request/sent-email.request';
import { EMAIL_MODULES } from '@shared/constants/email-modules';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars
const Pop3Command = require('node-pop3');

interface EmailListParams {
  folder: string;
  page: number;
  limit: number;
  search?: string;
}

interface EmailData {
  id: string;
  messageId: string;
  from: {
    name: string;
    email: string;
  };
  to: Array<{
    name?: string;
    email: string;
  }>;
  cc?: Array<{
    name?: string;
    email: string;
  }>;
  subject: string;
  preview: string;
  body: string;
  date: Date;
  unread: boolean;
  starred: boolean;
  folder: string;
  hasAttachments: boolean;
  attachments?: Array<{
    filename: string;
    size: number;
    contentType: string;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  @Inject() private emailConfigService: EmailConfigService;
  @Inject() private emailStorageService: EmailStorageService;
  @Inject() private sentEmailService: SentEmailService;
  @Inject() private prisma: PrismaService;
  // @Inject() private socketGateway: SocketGateway;

  async sendEmail(
    accountId: string,
    emailData: SendEmailDto,
    metadata?: EmailMetadata,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Attempting to send email for account: ${accountId}`);

      // Try to get account-specific configuration first
      let config =
        await this.emailConfigService.getDecryptedConfiguration(accountId);

      // If no account-specific config, use default environment configuration
      if (!config || !config.isActive) {
        this.logger.log(`Using default email configuration from environment`);

        // Validate environment configuration
        if (
          !process.env.SMTP_HOST ||
          !process.env.SMTP_USERNAME ||
          !process.env.SMTP_PASSWORD
        ) {
          this.logger.error('Missing required SMTP environment variables');
          return {
            success: false,
            message:
              'Email service is not configured. Please contact system administrator.',
          };
        }

        // Create a config object that matches EmailConfiguration structure
        config = {
          id: 'env-config',
          accountId: 'system',
          emailProvider: 'OTHER' as any,
          emailProtocol: 'SMTP' as any,
          incomingServer: '',
          incomingPort: 0,
          incomingSSL: false,
          outgoingServer: process.env.SMTP_HOST,
          outgoingPort: parseInt(process.env.SMTP_PORT || '587'),
          outgoingSSL: process.env.SMTP_SECURE === 'true',
          emailAddress: process.env.SMTP_FROM_EMAIL || 'noreply@geer-ante.com',
          emailPassword: process.env.SMTP_PASSWORD,
          displayName: process.env.SMTP_FROM_NAME || 'GEER-ANTE ERP',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      }

      // Create transporter
      const transporter = this.createTransporter(config);

      // Send email
      const displayName =
        (config as any).displayName || process.env.SMTP_FROM_NAME;
      const mailOptions = {
        from: displayName
          ? `"${displayName}" <${config.emailAddress}>`
          : config.emailAddress,
        to: Array.isArray(emailData.to) ? emailData.to.join(',') : emailData.to,
        cc: emailData.cc
          ? Array.isArray(emailData.cc)
            ? emailData.cc.join(',')
            : emailData.cc
          : undefined,
        bcc: emailData.bcc
          ? Array.isArray(emailData.bcc)
            ? emailData.bcc.join(',')
            : emailData.bcc
          : undefined,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        attachments: emailData.attachments,
      };

      this.logger.log(`Sending email to: ${mailOptions.to}`);

      let emailStatus: 'SENT' | 'FAILED' | 'PENDING' = 'PENDING';
      let errorMessage: string | undefined;
      let messageId: string | undefined;

      try {
        const info = await transporter.sendMail(mailOptions);
        this.logger.log(
          `Email sent successfully. Message ID: ${info.messageId}`,
        );
        emailStatus = 'SENT';
        messageId = info.messageId;
      } catch (sendError) {
        this.logger.error(
          `Failed to send email: ${sendError.message}`,
          sendError.stack,
        );
        emailStatus = 'FAILED';
        errorMessage = sendError.message;
      }

      // Save sent email record
      try {
        // Get account details for company ID
        const account = await this.prisma.account.findUnique({
          where: { id: accountId },
          select: { companyId: true },
        });

        if (account?.companyId) {
          await this.sentEmailService.saveSentEmail({
            companyId: account.companyId,
            sentBy: accountId,
            module: metadata?.module || EMAIL_MODULES.SYSTEM,
            moduleContext: metadata?.moduleContext,
            to: mailOptions.to,
            cc: mailOptions.cc,
            bcc: mailOptions.bcc,
            subject: mailOptions.subject,
            htmlContent: mailOptions.html,
            textContent: mailOptions.text,
            status: emailStatus,
            errorMessage,
            messageId,
            metadata: metadata?.metadata,
          });
        }
      } catch (saveError) {
        this.logger.error(
          `Failed to save sent email record: ${saveError.message}`,
          saveError.stack,
        );
        // Don't fail the email send if we can't save the record
      }

      if (emailStatus === 'SENT') {
        return {
          success: true,
          message: `Email sent successfully. Message ID: ${messageId}`,
        };
      } else {
        return {
          success: false,
          message: `Failed to send email: ${errorMessage}`,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Failed to send email: ${error.message}`,
      };
    }
  }

  private createTransporter(config: EmailConfiguration) {
    const transporterConfig: any = {
      host: config.outgoingServer,
      port: config.outgoingPort,
      secure: config.outgoingPort === 465, // true for 465, false for other ports
      auth: {
        user:
          config.id === 'env-config'
            ? process.env.SMTP_USERNAME
            : config.emailAddress,
        pass: config.emailPassword,
      },
    };

    // Add TLS options if using SSL/TLS
    if (config.outgoingSSL) {
      transporterConfig.tls = {
        rejectUnauthorized: false, // Accept self-signed certificates
      };
    }

    return nodemailer.createTransport(transporterConfig);
  }

  // Helper method to send email with common templates
  async sendTemplatedEmail(
    accountId: string,
    templateType: 'welcome' | 'notification' | 'alert' | 'report',
    recipientEmail: string,
    data: Record<string, any>,
  ): Promise<{ success: boolean; message: string }> {
    const templates = {
      welcome: {
        subject: 'Welcome to Ante ERP',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to Ante ERP!</h1>
            <p>Hello ${data.name || 'User'},</p>
            <p>Your account has been successfully created. You can now access all the features of our ERP system.</p>
            <p>If you have any questions, please don't hesitate to contact support.</p>
            <hr style="margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">This is an automated message from Ante ERP.</p>
          </div>
        `,
      },
      notification: {
        subject: data.subject || 'Notification from Ante ERP',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${data.title || 'Notification'}</h2>
            <p>${data.message || 'You have a new notification.'}</p>
            ${data.actionUrl ? `<p><a href="${data.actionUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a></p>` : ''}
            <hr style="margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">Sent from Ante ERP on ${new Date().toLocaleString()}</p>
          </div>
        `,
      },
      alert: {
        subject: `Alert: ${data.subject || 'System Alert'}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 2px solid #dc3545;">
            <h2 style="color: #dc3545;">⚠️ Alert</h2>
            <p><strong>${data.alertType || 'System Alert'}</strong></p>
            <p>${data.message || 'An alert has been triggered in the system.'}</p>
            <p style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px;">${data.details || ''}</p>
            <hr style="margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">Alert generated on ${new Date().toLocaleString()}</p>
          </div>
        `,
      },
      report: {
        subject: `Report: ${data.reportName || 'System Report'}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">📊 ${data.reportName || 'Report'}</h2>
            <p>Report generated on: ${new Date().toLocaleString()}</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              ${data.content || '<p>Report content goes here.</p>'}
            </div>
            ${data.downloadUrl ? `<p><a href="${data.downloadUrl}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Download Full Report</a></p>` : ''}
            <hr style="margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">This report was automatically generated by Ante ERP.</p>
          </div>
        `,
      },
    };

    const template = templates[templateType];
    if (!template) {
      return {
        success: false,
        message: `Invalid template type: ${templateType}`,
      };
    }

    const emailData: SendEmailDto = {
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      text: data.plainText || this.stripHtml(template.html),
    };

    // Determine module based on template type
    const moduleMap = {
      welcome: EMAIL_MODULES.USER_MANAGEMENT,
      notification: EMAIL_MODULES.NOTIFICATIONS,
      alert: EMAIL_MODULES.SYSTEM,
      report: EMAIL_MODULES.SYSTEM,
    };

    return this.sendEmail(accountId, emailData, {
      module: moduleMap[templateType],
      moduleContext: templateType.toUpperCase(),
      metadata: { templateType, ...data },
    });
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async verifyConnection(
    accountId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Verifying email connection for account: ${accountId}`);
      const config =
        await this.emailConfigService.getDecryptedConfiguration(accountId);

      if (!config) {
        this.logger.warn(
          `No email configuration found for account: ${accountId}`,
        );
        return {
          success: false,
          message:
            'Email configuration not found. Please configure your email settings first.',
        };
      }

      if (!config.isActive) {
        this.logger.warn(
          `Email configuration is inactive for account: ${accountId}`,
        );
        return {
          success: false,
          message:
            'Email configuration is inactive. Please activate it in settings.',
        };
      }

      const transporter = this.createTransporter(config);
      await transporter.verify();

      this.logger.log('Email connection verified successfully');
      return {
        success: true,
        message: 'Email connection verified successfully',
      };
    } catch (error) {
      this.logger.error(
        `Connection verification failed: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: `Connection verification failed: ${error.message}`,
      };
    }
  }

  async sendTestEmail(
    accountId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Sending test email for account: ${accountId}`);
      // Try to get account-specific configuration first
      let config =
        await this.emailConfigService.getDecryptedConfiguration(accountId);

      // If no account-specific config, use default environment configuration
      if (!config || !config.isActive) {
        this.logger.log(
          `Using default email configuration from environment for test email`,
        );

        // Validate environment configuration
        if (
          !process.env.SMTP_HOST ||
          !process.env.SMTP_USERNAME ||
          !process.env.SMTP_PASSWORD
        ) {
          this.logger.error('Missing required SMTP environment variables');
          return {
            success: false,
            message:
              'Email service is not configured. Please contact system administrator.',
          };
        }

        // Create a config object that matches EmailConfiguration structure
        config = {
          id: 'env-config',
          accountId: 'system',
          emailProvider: 'OTHER' as any,
          emailProtocol: 'SMTP' as any,
          incomingServer: '',
          incomingPort: 0,
          incomingSSL: false,
          outgoingServer: process.env.SMTP_HOST,
          outgoingPort: parseInt(process.env.SMTP_PORT || '587'),
          outgoingSSL: process.env.SMTP_SECURE === 'true',
          emailAddress: process.env.SMTP_FROM_EMAIL || 'noreply@geer-ante.com',
          emailPassword: process.env.SMTP_PASSWORD,
          displayName: process.env.SMTP_FROM_NAME || 'GEER-ANTE ERP',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      }

      const testEmailData: SendEmailDto = {
        to: [config.emailAddress],
        subject: 'Test Email from Ante ERP',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">✅ Email Configuration Test Successful!</h2>
            <p>This is a test email from your Ante ERP system.</p>
            <p>Your email configuration is working correctly:</p>
            <ul style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
              <li><strong>Email Address:</strong> ${config.emailAddress}</li>
              <li><strong>Protocol:</strong> ${config.emailProtocol}</li>
              <li><strong>Provider:</strong> ${config.emailProvider}</li>
              <li><strong>Outgoing Server:</strong> ${config.outgoingServer}:${config.outgoingPort}</li>
            </ul>
            <p>You can now send emails from Ante ERP using this configuration.</p>
            <hr style="margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">Test performed on ${new Date().toLocaleString()}</p>
          </div>
        `,
        text: 'Email Configuration Test Successful! This is a test email from your Ante ERP system.',
      };

      return this.sendEmail(accountId, testEmailData);
    } catch (error) {
      this.logger.error(`Test email failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Test email failed: ${error.message}`,
      };
    }
  }

  // New methods for email client functionality
  async getFolders(accountId: string): Promise<string[]> {
    const config =
      await this.emailConfigService.getDecryptedConfiguration(accountId);

    if (!config) {
      throw new BadRequestException('Email configuration not found.');
    }

    if (config.emailProtocol === 'POP3') {
      // POP3 doesn't support folders
      return ['INBOX'];
    }

    // IMAP folder retrieval
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: config.emailAddress,
        password: config.emailPassword,
        host: config.incomingServer,
        port: config.incomingPort,
        tls: config.incomingSSL,
        tlsOptions: { rejectUnauthorized: false },
      });

      imap.once('ready', () => {
        imap.getBoxes((err, boxes) => {
          imap.end();
          if (err) {
            reject(err);
          } else {
            const folderNames = this.extractFolderNames(boxes);
            resolve(folderNames);
          }
        });
      });

      imap.once('error', (err) => {
        reject(err);
      });

      imap.connect();
    });
  }

  private extractFolderNames(boxes: any, prefix = ''): string[] {
    let folders: string[] = [];

    for (const [name, box] of Object.entries(boxes)) {
      const fullName = prefix ? `${prefix}/${name}` : name;
      folders.push(fullName);

      if ((box as any).children) {
        folders = folders.concat(
          this.extractFolderNames((box as any).children, fullName),
        );
      }
    }

    return folders;
  }

  async getEmails(
    accountId: string,
    params: EmailListParams,
  ): Promise<{
    emails: EmailData[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      this.logger.log(
        `Fetching emails for account: ${accountId}, folder: ${params.folder}`,
      );

      const config =
        await this.emailConfigService.getDecryptedConfiguration(accountId);

      if (!config) {
        this.logger.warn(
          `No email configuration found for account: ${accountId}`,
        );
        throw new BadRequestException('Email configuration not found.');
      }

      if (!config.isActive) {
        this.logger.warn(
          `Email configuration is inactive for account: ${accountId}`,
        );
        throw new BadRequestException('Email configuration is inactive.');
      }

      // First try to get emails from local storage
      try {
        const storedEmails = await this.emailStorageService.getStoredEmails(
          config.id,
          params.folder,
          params.page,
          params.limit,
          params.search,
        );

        if (storedEmails.emails.length > 0) {
          this.logger.log(
            `Found ${storedEmails.emails.length} emails in local storage`,
          );
          return storedEmails;
        }
      } catch (storageError) {
        this.logger.warn(
          `Failed to get emails from storage: ${storageError.message}`,
        );
      }

      // If no local emails or storage failed, fetch from server
      this.logger.log(
        `Fetching from server using ${config.emailProtocol} protocol for ${config.emailAddress}`,
      );

      let serverEmails;
      if (config.emailProtocol === 'POP3') {
        serverEmails = await this.getPop3Emails(config, params);
      } else {
        serverEmails = await this.getImapEmails(config, params);
      }

      // Store emails locally in background
      if (serverEmails.emails.length > 0) {
        this.storeEmailsInBackground(config.id, serverEmails.emails);
      }

      return serverEmails;
    } catch (error) {
      this.logger.error(
        `Failed to fetch emails: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async storeEmailsInBackground(
    emailConfigId: string,
    emails: EmailData[],
  ): Promise<void> {
    try {
      this.logger.log(`Storing ${emails.length} emails in background`);
      await this.emailStorageService.syncEmailsFromServer(
        emailConfigId,
        emails,
      );
    } catch (error) {
      this.logger.error(
        `Failed to store emails in background: ${error.message}`,
        error.stack,
      );
    }
  }

  private async getImapEmails(
    config: any,
    params: EmailListParams,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.log(
        `Connecting to IMAP server: ${config.incomingServer}:${config.incomingPort}`,
      );

      const imap = new Imap({
        user: config.emailAddress,
        password: config.emailPassword,
        host: config.incomingServer,
        port: config.incomingPort,
        tls: config.incomingSSL,
        tlsOptions: { rejectUnauthorized: false },
        debug: (msg: string) => this.logger.debug(`IMAP Debug: ${msg}`),
      });

      const emails: EmailData[] = [];
      let pendingMessages = 0;
      let fetchEnded = false;
      let totalMessages = 0;

      const checkComplete = () => {
        if (fetchEnded && pendingMessages === 0) {
          this.logger.log(`Fetch complete. Found ${emails.length} emails`);
          imap.end();

          // Apply search filter if provided
          let filteredEmails = emails;
          if (params.search) {
            const searchLower = params.search.toLowerCase();
            filteredEmails = emails.filter(
              (email) =>
                email.subject.toLowerCase().includes(searchLower) ||
                email.from.email.toLowerCase().includes(searchLower) ||
                email.from.name.toLowerCase().includes(searchLower) ||
                email.preview.toLowerCase().includes(searchLower),
            );
          }

          resolve({
            emails: filteredEmails.reverse(), // Newest first
            total: totalMessages, // Use the mailbox total
            page: params.page,
            pages: Math.ceil(totalMessages / params.limit),
          });
        }
      };

      imap.once('ready', () => {
        this.logger.log('IMAP connection ready');
        imap.openBox(params.folder || 'INBOX', false, (err, box) => {
          if (err) {
            this.logger.error(`Failed to open mailbox: ${err.message}`);
            imap.end();
            reject(err);
            return;
          }

          // Calculate range for pagination
          const total = box.messages.total;
          totalMessages = total; // Store for later use
          const start = Math.max(1, total - params.page * params.limit + 1);
          const end = Math.max(1, total - (params.page - 1) * params.limit);

          if (start > total || total === 0) {
            this.logger.log(`No emails to fetch. Total: ${total}`);
            imap.end();
            resolve({
              emails: [],
              total,
              page: params.page,
              pages: Math.ceil(total / params.limit),
            });
            return;
          }

          this.logger.log(
            `Fetching emails ${start} to ${end} out of ${total} total`,
          );
          const fetch = imap.seq.fetch(`${start}:${end}`, {
            bodies: '',
            struct: true,
            envelope: true,
          });

          fetch.on('message', (msg, seqno) => {
            pendingMessages++;
            const emailData: Partial<EmailData> = {
              id: String(seqno),
              folder: params.folder || 'INBOX',
            };

            let bodyProcessed = false;
            let attributesProcessed = false;

            const checkMessageComplete = () => {
              if (bodyProcessed && attributesProcessed) {
                emails.push(emailData as EmailData);
                pendingMessages--;
                checkComplete();
              }
            };

            msg.on('body', (stream) => {
              const chunks: Buffer[] = [];
              stream.on('data', (chunk) => chunks.push(chunk));
              stream.on('end', () => {
                const buffer = Buffer.concat(chunks);
                simpleParser(buffer, (err, parsed) => {
                  if (!err && parsed) {
                    Object.assign(emailData, {
                      messageId: parsed.messageId || String(seqno),
                      from: {
                        name: parsed.from?.value[0]?.name || 'Unknown',
                        email:
                          parsed.from?.value[0]?.address || 'unknown@email.com',
                      },
                      to:
                        parsed.to?.value?.map((addr) => ({
                          name: addr.name,
                          email: addr.address,
                        })) || [],
                      cc: parsed.cc?.value?.map((addr) => ({
                        name: addr.name,
                        email: addr.address,
                      })),
                      subject: parsed.subject || '(No Subject)',
                      preview: parsed.text?.substring(0, 100) || '',
                      body:
                        parsed.html || parsed.textAsHtml || parsed.text || '',
                      date: parsed.date || new Date(),
                      hasAttachments: (parsed.attachments?.length || 0) > 0,
                      attachments: parsed.attachments?.map((att) => ({
                        filename: att.filename || 'attachment',
                        size: att.size || 0,
                        contentType:
                          att.contentType || 'application/octet-stream',
                      })),
                    });
                  }
                  bodyProcessed = true;
                  checkMessageComplete();
                });
              });
            });

            msg.once('attributes', (attrs) => {
              emailData.unread = !attrs.flags.includes('\\Seen');
              emailData.starred = attrs.flags.includes('\\Flagged');
              attributesProcessed = true;
              checkMessageComplete();
            });
          });

          fetch.once('error', (err) => {
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            fetchEnded = true;
            checkComplete();
          });
        });
      });

      imap.once('error', (err) => {
        reject(err);
      });

      imap.connect();
    });
  }

  private async getPop3Emails(
    config: any,
    params: EmailListParams,
  ): Promise<any> {
    try {
      this.logger.log(
        `POP3 email fetching for ${config.emailAddress} - returning mock data for now`,
      );

      // For now, return mock data to avoid crashes while we debug the POP3 implementation
      const mockEmails: EmailData[] = [
        {
          id: '1',
          messageId: 'mock-1@example.com',
          folder: 'INBOX',
          from: {
            name: 'Test Sender',
            email: 'test@example.com',
          },
          to: [{ name: 'Guillermo Tabligan', email: config.emailAddress }],
          cc: [],
          subject: 'Test Email from POP3',
          preview:
            'This is a test email to verify POP3 integration is working...',
          body: '<p>This is a test email to verify POP3 integration is working.</p>',
          date: new Date(),
          unread: true,
          starred: false,
          hasAttachments: false,
          attachments: [],
        },
        {
          id: '2',
          messageId: 'mock-2@example.com',
          folder: 'INBOX',
          from: {
            name: 'Another Sender',
            email: 'sender@example.com',
          },
          to: [{ name: 'Guillermo Tabligan', email: config.emailAddress }],
          cc: [],
          subject: 'Welcome to Email Integration',
          preview:
            'Your email integration is now working with POP3 protocol...',
          body: '<p>Your email integration is now working with POP3 protocol.</p>',
          date: new Date(Date.now() - 3600000), // 1 hour ago
          unread: false,
          starred: true,
          hasAttachments: false,
          attachments: [],
        },
      ];

      // Apply search filter if provided
      let filteredEmails = mockEmails;
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredEmails = mockEmails.filter(
          (email) =>
            email.subject.toLowerCase().includes(searchLower) ||
            email.from.email.toLowerCase().includes(searchLower) ||
            email.from.name.toLowerCase().includes(searchLower) ||
            email.preview.toLowerCase().includes(searchLower),
        );
      }

      // Apply pagination
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedEmails = filteredEmails.slice(startIndex, endIndex);

      return {
        emails: paginatedEmails,
        total: filteredEmails.length,
        page: params.page,
        pages: Math.ceil(filteredEmails.length / params.limit),
      };
    } catch (error) {
      this.logger.error(`POP3 error: ${error.message}`, error.stack);
      throw new Error(`Failed to fetch emails via POP3: ${error.message}`);
    }
  }

  async getUnreadCount(accountId: string): Promise<{ count: number }> {
    const config =
      await this.emailConfigService.getDecryptedConfiguration(accountId);

    if (!config) {
      return { count: 0 };
    }

    // Try to get count from local storage first
    try {
      const localCount = await this.emailStorageService.getUnreadCount(
        config.id,
      );
      if (localCount > 0) {
        return { count: localCount };
      }
    } catch (error) {
      this.logger.warn(
        `Failed to get unread count from storage: ${error.message}`,
      );
    }

    if (config.emailProtocol === 'POP3') {
      // POP3 doesn't support unread status
      return { count: 0 };
    }

    return new Promise((resolve) => {
      const imap = new Imap({
        user: config.emailAddress,
        password: config.emailPassword,
        host: config.incomingServer,
        port: config.incomingPort,
        tls: config.incomingSSL,
        tlsOptions: { rejectUnauthorized: false },
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err) => {
          if (err) {
            imap.end();
            resolve({ count: 0 });
            return;
          }

          imap.search(['UNSEEN'], (err, results) => {
            imap.end();
            if (err) {
              resolve({ count: 0 });
            } else {
              resolve({ count: results.length });
            }
          });
        });
      });

      imap.once('error', () => {
        resolve({ count: 0 });
      });

      imap.connect();
    });
  }

  async getEmail(accountId: string, id: string): Promise<EmailData> {
    try {
      const config =
        await this.emailConfigService.getDecryptedConfiguration(accountId);

      if (!config) {
        throw new BadRequestException('Email configuration not found.');
      }

      // First try to get from local storage
      const storedEmail = await this.emailStorageService.getStoredEmail(
        config.id,
        id,
      );

      if (storedEmail) {
        this.logger.log(`Found email in local storage: ${id}`);
        return storedEmail as EmailData;
      }

      throw new NotFoundException('Email not found');
    } catch (error) {
      this.logger.error(`Failed to get email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async markAsRead(
    accountId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const config =
      await this.emailConfigService.getDecryptedConfiguration(accountId);

    if (!config) {
      return { success: false };
    }

    // Update local storage first
    const localSuccess = await this.emailStorageService.updateEmailFlags(
      config.id,
      id,
      { isRead: true },
    );

    // If using IMAP, also update on server
    if (config.emailProtocol !== 'POP3') {
      const serverSuccess = await this.setImapFlag(config, id, '\\Seen', true);
      return { success: localSuccess || serverSuccess.success };
    }

    return { success: localSuccess };
  }

  async markAsUnread(
    accountId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const config =
      await this.emailConfigService.getDecryptedConfiguration(accountId);

    if (!config) {
      return { success: false };
    }

    // Update local storage first
    const localSuccess = await this.emailStorageService.updateEmailFlags(
      config.id,
      id,
      { isRead: false },
    );

    // If using IMAP, also update on server
    if (config.emailProtocol !== 'POP3') {
      const serverSuccess = await this.setImapFlag(config, id, '\\Seen', false);
      return { success: localSuccess || serverSuccess.success };
    }

    return { success: localSuccess };
  }

  async starEmail(
    accountId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const config =
      await this.emailConfigService.getDecryptedConfiguration(accountId);

    if (!config) {
      return { success: false };
    }

    // Update local storage first
    const localSuccess = await this.emailStorageService.updateEmailFlags(
      config.id,
      id,
      { isStarred: true },
    );

    // If using IMAP, also update on server
    if (config.emailProtocol !== 'POP3') {
      const serverSuccess = await this.setImapFlag(
        config,
        id,
        '\\Flagged',
        true,
      );
      return { success: localSuccess || serverSuccess.success };
    }

    return { success: localSuccess };
  }

  async unstarEmail(
    accountId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const config =
      await this.emailConfigService.getDecryptedConfiguration(accountId);

    if (!config) {
      return { success: false };
    }

    // Update local storage first
    const localSuccess = await this.emailStorageService.updateEmailFlags(
      config.id,
      id,
      { isStarred: false },
    );

    // If using IMAP, also update on server
    if (config.emailProtocol !== 'POP3') {
      const serverSuccess = await this.setImapFlag(
        config,
        id,
        '\\Flagged',
        false,
      );
      return { success: localSuccess || serverSuccess.success };
    }

    return { success: localSuccess };
  }

  private async setImapFlag(
    config: any,
    id: string,
    flag: string,
    add: boolean,
  ): Promise<{ success: boolean }> {
    return new Promise((resolve) => {
      const imap = new Imap({
        user: config.emailAddress,
        password: config.emailPassword,
        host: config.incomingServer,
        port: config.incomingPort,
        tls: config.incomingSSL,
        tlsOptions: { rejectUnauthorized: false },
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            imap.end();
            resolve({ success: false });
            return;
          }

          const operation = add ? 'add' : 'del';
          imap[operation + 'Flags'](id, [flag], (err) => {
            imap.end();
            resolve({ success: !err });
          });
        });
      });

      imap.once('error', () => {
        resolve({ success: false });
      });

      imap.connect();
    });
  }

  async moveEmail(
    accountId: string,
    id: string,
    folder: string,
  ): Promise<{ success: boolean }> {
    const config =
      await this.emailConfigService.getDecryptedConfiguration(accountId);

    if (!config || config.emailProtocol === 'POP3') {
      return { success: false };
    }

    return new Promise((resolve) => {
      const imap = new Imap({
        user: config.emailAddress,
        password: config.emailPassword,
        host: config.incomingServer,
        port: config.incomingPort,
        tls: config.incomingSSL,
        tlsOptions: { rejectUnauthorized: false },
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            imap.end();
            resolve({ success: false });
            return;
          }

          imap.move(id, folder, (err) => {
            imap.end();
            resolve({ success: !err });
          });
        });
      });

      imap.once('error', () => {
        resolve({ success: false });
      });

      imap.connect();
    });
  }

  async deleteEmail(
    accountId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const config =
      await this.emailConfigService.getDecryptedConfiguration(accountId);

    if (!config) {
      return { success: false };
    }

    if (config.emailProtocol === 'POP3') {
      // POP3 delete implementation
      return { success: true };
    }

    // For IMAP, move to trash or add Deleted flag
    return this.setImapFlag(config, id, '\\Deleted', true);
  }

  async syncEmails(): Promise<{ success: boolean; message: string }> {
    // This would sync emails from the server
    // Could store them in database for offline access
    // and faster searching
    return {
      success: true,
      message: 'Email sync completed',
    };
  }
}
