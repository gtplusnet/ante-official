import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { EmailService } from '@modules/communication/email/email.service';
import { ApprovalService } from '@modules/approval/approval.service';
import { TemplateEngineService } from './template-engine.service';
import { TokenManagerService } from './token-manager.service';
import { SendEmailApprovalRequest } from '@shared/request';
import {
  EmailApprovalTokenResponse,
  EmailApprovalActionResponse,
  TokenValidationResponse,
} from '@shared/response';
import { EmailApprovalContext } from '../interfaces';
import { EmailAttachmentDto } from '@modules/communication/email/email-send.dto';

@Injectable()
export class EmailApprovalService {
  private readonly logger = new Logger(EmailApprovalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
    private readonly emailService: EmailService,
    private readonly approvalService: ApprovalService,
    private readonly templateEngine: TemplateEngineService,
    private readonly tokenManager: TokenManagerService,
  ) {}

  /**
   * Send approval email with encrypted action buttons
   */
  async sendApprovalEmail(
    request: SendEmailApprovalRequest,
  ): Promise<EmailApprovalTokenResponse> {
    try {
      this.logger.log(
        `Sending approval email for task ${request.taskId} to ${request.recipientEmail}`,
      );
      this.logger.log(`Request details: ${JSON.stringify(request, null, 2)}`);

      // Get task and approver information
      const [task, approver] = await Promise.all([
        this.prisma.task.findUnique({
          where: { id: request.taskId },
          include: { ApprovalMetadata: true },
        }),
        this.prisma.account.findUnique({
          where: { id: request.approverId },
          select: { firstName: true, lastName: true, email: true },
        }),
      ]);

      if (!task) {
        throw new NotFoundException(`Task with ID ${request.taskId} not found`);
      }

      if (!approver) {
        throw new NotFoundException(
          `Approver with ID ${request.approverId} not found`,
        );
      }

      // Create email approval context
      const context: EmailApprovalContext = {
        taskId: request.taskId,
        approverId: request.approverId,
        approverName: `${approver.firstName} ${approver.lastName}`,
        approverEmail: approver.email,
        sourceModule: request.module,
        sourceId: request.sourceId,
        templateName: request.templateName,
        approvalData: request.approvalData,
        baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        companyName: 'GEER-ANTE ERP',
      };

      // Generate secure token
      const token = await this.tokenManager.generateToken(context);

      // Render email template
      const emailContent = await this.templateEngine.renderTemplate(
        request.templateName,
        request.approvalData,
        token,
        context.approverName,
        context.approverEmail,
      );

      // Send email using system account (we'll use the first available account or a system account)
      // For now, we'll use a system approach - this might need adjustment based on your email setup
      const systemAccountId = this.utilityService.accountInformation.id;

      // Prepare attachments if provided
      const attachments = request.attachments?.map(
        (attachment) =>
          ({
            filename: attachment.filename,
            content:
              attachment.content instanceof Buffer
                ? attachment.content.toString('base64')
                : attachment.content,
          }) as EmailAttachmentDto,
      );

      await this.emailService.sendEmail(
        systemAccountId,
        {
          to: request.recipientEmail,
          subject: emailContent.subject,
          html: emailContent.htmlContent,
          attachments,
        },
        {
          module: request.module,
          moduleContext: 'APPROVAL_REQUEST',
          metadata: {
            taskId: request.taskId,
            sourceId: request.sourceId,
            templateName: request.templateName,
            approvalToken: token,
          },
        },
      );

      this.logger.log(
        `Approval email sent successfully for task ${request.taskId}`,
      );

      // Return token response
      return await this.formatTokenResponse(token);
    } catch (error) {
      this.logger.error('Failed to send approval email:', error);
      throw error;
    }
  }

  /**
   * Process email approval action (approve/reject)
   */
  async processEmailAction(
    token: string,
    action: string,
    remarks?: string,
  ): Promise<EmailApprovalActionResponse> {
    try {
      this.logger.log(
        `Processing email action: ${action} for token: ${token.substring(0, 10)}...`,
      );

      // Validate token
      const validation = await this.tokenManager.validateToken(token);
      if (!validation.isValid) {
        throw new BadRequestException(
          validation.errorMessage || 'Invalid token',
        );
      }

      // Mark token as used to prevent replay attacks
      await this.tokenManager.markTokenAsUsed(token);

      // Set the approver's account context for the approval service
      const approver = await this.prisma.account.findUnique({
        where: { id: validation.approverId! },
        include: {
          role: {
            include: {
              roleGroup: true,
              parentRole: true,
            },
          },
          company: true,
        },
      });

      if (!approver) {
        throw new BadRequestException('Approver account not found');
      }

      // Set the account information in utility service so approval service can access it
      this.utilityService.setAccountInformation(approver as any);

      // Process the approval action
      await this.approvalService.processApproval({
        taskId: validation.taskId!,
        action,
        remarks,
      });

      this.logger.log(
        `Email action ${action} processed successfully for task ${validation.taskId}`,
      );

      return {
        success: true,
        message: `Request ${action}ed successfully`,
        taskId: validation.taskId,
        sourceModule: validation.sourceModule,
      };
    } catch (error) {
      this.logger.error(`Failed to process email action ${action}:`, error);

      throw error; // Let the controller handle the error and display it
    }
  }

  /**
   * Validate email approval token
   */
  async validateToken(token: string): Promise<TokenValidationResponse> {
    return await this.tokenManager.validateToken(token);
  }

  /**
   * Get token information for rendering rejection form
   */
  async getTokenInfo(token: string): Promise<any> {
    const validation = await this.tokenManager.validateToken(token);

    if (!validation.isValid) {
      throw new BadRequestException(validation.errorMessage || 'Invalid token');
    }

    // Get additional context from database
    const tokenRecord = await this.prisma.emailApprovalToken.findUnique({
      where: { token },
      include: {
        task: {
          include: {
            ApprovalMetadata: true,
          },
        },
        approver: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      throw new NotFoundException('Token not found');
    }

    return {
      taskId: tokenRecord.taskId,
      approver: {
        name: `${tokenRecord.approver.firstName} ${tokenRecord.approver.lastName}`,
        email: tokenRecord.approver.email,
      },
      sourceModule: tokenRecord.sourceModule,
      sourceId: tokenRecord.sourceId,
      templateData: tokenRecord.templateData,
      task: tokenRecord.task,
    };
  }

  /**
   * Format token response for API
   */
  private async formatTokenResponse(
    token: string,
  ): Promise<EmailApprovalTokenResponse> {
    const tokenRecord = await this.prisma.emailApprovalToken.findUnique({
      where: { token },
    });

    if (!tokenRecord) {
      throw new NotFoundException('Token not found');
    }

    return {
      id: tokenRecord.id,
      token: tokenRecord.token,
      isUsed: tokenRecord.isUsed,
      createdAt: tokenRecord.createdAt.toISOString(),
    };
  }

  /**
   * Generate redirect URL based on action and module
   */
  private generateRedirectUrl(action: string, sourceModule: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Module-specific redirect URLs
    const moduleRedirects = {
      PAYROLL: '/member/manpower/payroll/center',
      HR_FILING: '/member/manpower/filings',
      PURCHASE_ORDER: '/member/asset/purchasing/purchase-orders',
    };

    const moduleUrl = moduleRedirects[sourceModule] || '/member/dashboard';

    // Add query parameter to show success message
    return `${baseUrl}${moduleUrl}?approval=${action}&status=success`;
  }

  /**
   * Generate error redirect URL
   */
  private generateErrorRedirectUrl(): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/member/dashboard?error=approval_failed`;
  }
}
