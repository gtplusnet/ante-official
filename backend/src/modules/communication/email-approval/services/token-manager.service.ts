import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { EncryptionService } from '@common/encryption.service';
import { TokenData, EmailApprovalContext } from '../interfaces';
import { TokenValidationResponse } from '@shared/response';
import * as crypto from 'crypto';

@Injectable()
export class TokenManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Generate a secure encrypted token for email approval
   */
  async generateToken(context: EmailApprovalContext): Promise<string> {
    // Create token data with timestamp and nonce for security
    const tokenData: TokenData = {
      taskId: context.taskId,
      approverId: context.approverId,
      sourceModule: context.sourceModule,
      sourceId: context.sourceId,
      action: 'approve', // Default action, specific action will be in URL
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    // Encrypt the token data
    const { encrypted, iv } = await this.encryptionService.encrypt(
      JSON.stringify(tokenData),
    );

    // Combine encrypted data with IV for the final token
    const token = `${encrypted}.${iv.toString('hex')}`;

    // Store token in database
    await this.storeToken(token, context);

    return token;
  }

  /**
   * Validate and decrypt an email approval token
   */
  async validateToken(token: string): Promise<TokenValidationResponse> {
    try {
      // Check if token exists in database and is not used
      const tokenRecord = await this.prisma.emailApprovalToken.findUnique({
        where: { token },
        include: {
          task: true,
          approver: true,
        },
      });

      if (!tokenRecord) {
        return {
          isValid: false,
          errorMessage: 'Invalid or expired token',
        };
      }

      if (tokenRecord.isUsed) {
        return {
          isValid: false,
          errorMessage: 'Token has already been used',
        };
      }

      // Check if associated task is still open
      if (!tokenRecord.task.isOpen) {
        return {
          isValid: false,
          errorMessage: 'Associated task is no longer active',
        };
      }

      // Decrypt and validate token data
      const [encryptedData, ivHex] = token.split('.');
      if (!encryptedData || !ivHex) {
        return {
          isValid: false,
          errorMessage: 'Malformed token',
        };
      }

      const iv = Buffer.from(ivHex, 'hex');
      const decryptedData = await this.encryptionService.decrypt(
        encryptedData,
        iv,
      );
      const tokenData: TokenData = JSON.parse(decryptedData);

      // Verify token data matches database record
      if (
        tokenData.taskId !== tokenRecord.taskId ||
        tokenData.approverId !== tokenRecord.approverId ||
        tokenData.sourceModule !== tokenRecord.sourceModule ||
        tokenData.sourceId !== tokenRecord.sourceId
      ) {
        return {
          isValid: false,
          errorMessage: 'Token data mismatch',
        };
      }

      return {
        isValid: true,
        taskId: tokenData.taskId,
        approverId: tokenData.approverId,
        sourceModule: tokenData.sourceModule,
        sourceId: tokenData.sourceId,
        action: tokenData.action,
        isUsed: tokenRecord.isUsed,
      };
    } catch (error) {
      this.utilityService.log(`Token validation error: ${error.message}`);
      return {
        isValid: false,
        errorMessage: 'Token validation failed',
      };
    }
  }

  /**
   * Mark a token as used to prevent replay attacks
   */
  async markTokenAsUsed(token: string): Promise<void> {
    await this.prisma.emailApprovalToken.update({
      where: { token },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });
  }

  /**
   * Store token in database for tracking and validation
   */
  private async storeToken(
    token: string,
    context: EmailApprovalContext,
  ): Promise<void> {
    await this.prisma.emailApprovalToken.create({
      data: {
        token,
        taskId: context.taskId,
        approverId: context.approverId,
        sourceModule: context.sourceModule,
        sourceId: context.sourceId,
        action: 'email_approval', // Generic action type
        templateData: context.approvalData,
      },
    });
  }

  /**
   * Clean up old unused tokens (optional maintenance method)
   */
  async cleanupOldTokens(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.emailApprovalToken.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isUsed: false,
      },
    });

    return result.count;
  }
}
