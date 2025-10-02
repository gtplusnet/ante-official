import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';

interface EmailAttachmentData {
  filename: string;
  content: Buffer;
  contentType: string;
  size: number;
}

interface EmailToStore {
  messageId: string;
  folder: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  toEmails: Array<{ name?: string; email: string }>;
  ccEmails?: Array<{ name?: string; email: string }>;
  bccEmails?: Array<{ name?: string; email: string }>;
  preview?: string;
  textContent?: string;
  htmlContent: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  size?: number;
  uid?: string;
  flags?: any[];
  attachments?: EmailAttachmentData[];
}

@Injectable()
export class EmailStorageService {
  private readonly logger = new Logger(EmailStorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private prisma: PrismaService) {
    this.s3Client = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT,
      region: 'sgp1',
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
      },
    });
    this.bucketName = process.env.DO_SPACES_BUCKET;
  }

  async storeEmail(
    emailConfigId: string,
    emailData: EmailToStore,
  ): Promise<string> {
    try {
      this.logger.log(`Storing email: ${emailData.subject}`);

      // Check if email already exists
      const existingEmail = await this.prisma.email.findFirst({
        where: {
          emailConfigId,
          messageId: emailData.messageId,
        },
      });

      if (existingEmail) {
        this.logger.log(`Email already exists: ${emailData.messageId}`);
        return existingEmail.id;
      }

      // Store attachments in S3 first
      const storedAttachments = [];
      if (emailData.attachments && emailData.attachments.length > 0) {
        for (const attachment of emailData.attachments) {
          const s3Key = await this.uploadAttachmentToS3(attachment);
          const s3Url = `${process.env.DO_SPACES_ENDPOINT}/${this.bucketName}/${s3Key}`;

          storedAttachments.push({
            filename: attachment.filename,
            s3Key,
            s3Url,
            contentType: attachment.contentType,
            size: attachment.size,
          });
        }
      }

      // Create email record
      const email = await this.prisma.email.create({
        data: {
          emailConfigId,
          messageId: emailData.messageId,
          folder: emailData.folder,
          subject: emailData.subject,
          fromName: emailData.fromName,
          fromEmail: emailData.fromEmail,
          toEmails: emailData.toEmails,
          ccEmails: emailData.ccEmails || [],
          bccEmails: emailData.bccEmails || [],
          preview: emailData.preview,
          textContent: emailData.textContent,
          htmlContent: emailData.htmlContent,
          receivedAt: emailData.date,
          isRead: emailData.isRead,
          isStarred: emailData.isStarred,
          hasAttachments: storedAttachments.length > 0,
          size: emailData.size,
          uid: emailData.uid,
          flags: emailData.flags,
          synced: true,
          lastSyncedAt: new Date(),
          attachments: {
            create: storedAttachments.map((att) => ({
              filename: att.filename,
              originalFilename: att.filename,
              s3Key: att.s3Key,
              s3Url: att.s3Url,
              contentType: att.contentType,
              size: att.size,
            })),
          },
        },
        include: {
          attachments: true,
        },
      });

      this.logger.log(`Email stored successfully: ${email.id}`);
      return email.id;
    } catch (error) {
      this.logger.error(`Failed to store email: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async uploadAttachmentToS3(
    attachment: EmailAttachmentData,
  ): Promise<string> {
    const fileKey = `email-attachments/${uuidv4()}-${attachment.filename}`;

    try {
      const uploadParams = {
        Bucket: this.bucketName,
        Key: fileKey,
        Body: attachment.content,
        ContentType: attachment.contentType,
        ACL: 'private' as const, // Attachments should be private
      };

      const upload = new Upload({
        client: this.s3Client,
        params: uploadParams,
      });

      await upload.done();
      this.logger.log(`Attachment uploaded to S3: ${fileKey}`);
      return fileKey;
    } catch (error) {
      this.logger.error(
        `Failed to upload attachment to S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getStoredEmails(
    emailConfigId: string,
    folder = 'INBOX',
    page = 1,
    limit = 20,
    search?: string,
  ) {
    try {
      const where: any = {
        emailConfigId,
        folder,
      };

      if (search) {
        where.OR = [
          { subject: { contains: search, mode: 'insensitive' } },
          { fromName: { contains: search, mode: 'insensitive' } },
          { fromEmail: { contains: search, mode: 'insensitive' } },
          { textContent: { contains: search, mode: 'insensitive' } },
          { htmlContent: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [emails, total] = await Promise.all([
        this.prisma.email.findMany({
          where,
          include: {
            attachments: true,
          },
          orderBy: {
            receivedAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.email.count({ where }),
      ]);

      return {
        emails: emails.map((email) => ({
          id: email.id,
          messageId: email.messageId,
          folder: email.folder,
          from: {
            name: email.fromName,
            email: email.fromEmail,
          },
          to: email.toEmails as Array<{ name?: string; email: string }>,
          cc: email.ccEmails as Array<{ name?: string; email: string }>,
          subject: email.subject,
          preview:
            email.preview ||
            email.textContent?.substring(0, 100) ||
            email.htmlContent?.replace(/<[^>]*>/g, '').substring(0, 100) ||
            '',
          body: email.htmlContent || email.textContent || '',
          date: email.receivedAt,
          unread: !email.isRead,
          starred: email.isStarred,
          hasAttachments: email.hasAttachments,
          attachments: email.attachments?.map((att) => ({
            filename: att.filename,
            size: att.size,
            contentType: att.contentType,
            url: att.s3Url,
          })),
        })),
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get stored emails: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getStoredEmail(emailConfigId: string, emailId: string) {
    try {
      const email = await this.prisma.email.findFirst({
        where: {
          id: emailId,
          emailConfigId,
        },
        include: {
          attachments: true,
        },
      });

      if (!email) {
        return null;
      }

      return {
        id: email.id,
        messageId: email.messageId,
        folder: email.folder,
        from: {
          name: email.fromName,
          email: email.fromEmail,
        },
        to: email.toEmails as Array<{ name?: string; email: string }>,
        cc: email.ccEmails as Array<{ name?: string; email: string }>,
        bcc: email.bccEmails as Array<{ name?: string; email: string }>,
        subject: email.subject,
        preview:
          email.preview ||
          email.textContent?.substring(0, 100) ||
          email.htmlContent?.replace(/<[^>]*>/g, '').substring(0, 100) ||
          '',
        body: email.htmlContent || email.textContent || '',
        date: email.receivedAt,
        unread: !email.isRead,
        starred: email.isStarred,
        hasAttachments: email.hasAttachments,
        attachments: email.attachments?.map((att) => ({
          id: att.id,
          filename: att.filename,
          size: att.size,
          contentType: att.contentType,
          url: att.s3Url,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get stored email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateEmailFlags(
    emailConfigId: string,
    emailId: string,
    updates: { isRead?: boolean; isStarred?: boolean },
  ) {
    try {
      const email = await this.prisma.email.updateMany({
        where: {
          id: emailId,
          emailConfigId,
        },
        data: updates,
      });

      return email.count > 0;
    } catch (error) {
      this.logger.error(
        `Failed to update email flags: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async getUnreadCount(
    emailConfigId: string,
    folder = 'INBOX',
  ): Promise<number> {
    try {
      const count = await this.prisma.email.count({
        where: {
          emailConfigId,
          folder,
          isRead: false,
        },
      });
      return count;
    } catch (error) {
      this.logger.error(
        `Failed to get unread count: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  async deleteStoredEmail(
    emailConfigId: string,
    emailId: string,
  ): Promise<boolean> {
    try {
      // Get email with attachments first
      const email = await this.prisma.email.findFirst({
        where: {
          id: emailId,
          emailConfigId,
        },
        include: {
          attachments: true,
        },
      });

      if (!email) {
        return false;
      }

      // Delete attachments from S3 (optional - you might want to keep them for audit)
      // for (const attachment of email.attachments) {
      //   await this.deleteAttachmentFromS3(attachment.s3Key);
      // }

      // Delete email and attachments from database
      await this.prisma.email.delete({
        where: {
          id: emailId,
        },
      });

      this.logger.log(`Email deleted: ${emailId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete stored email: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async syncEmailsFromServer(
    emailConfigId: string,
    serverEmails: any[],
  ): Promise<number> {
    let syncedCount = 0;

    for (const serverEmail of serverEmails) {
      try {
        const emailToStore: EmailToStore = {
          messageId: serverEmail.messageId,
          folder: serverEmail.folder,
          subject: serverEmail.subject,
          fromName: serverEmail.from.name,
          fromEmail: serverEmail.from.email,
          toEmails: serverEmail.to,
          ccEmails: serverEmail.cc,
          bccEmails: serverEmail.bcc,
          preview: serverEmail.preview,
          textContent: serverEmail.textBody,
          htmlContent: serverEmail.body,
          date: serverEmail.date,
          isRead: !serverEmail.unread,
          isStarred: serverEmail.starred,
          attachments: serverEmail.attachments,
        };

        await this.storeEmail(emailConfigId, emailToStore);
        syncedCount++;
      } catch (error) {
        this.logger.warn(
          `Failed to sync email ${serverEmail.messageId}: ${error.message}`,
        );
      }
    }

    this.logger.log(`Synced ${syncedCount} emails for config ${emailConfigId}`);
    return syncedCount;
  }
}
