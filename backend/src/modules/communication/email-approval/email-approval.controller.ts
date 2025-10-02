import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { EmailApprovalService } from './services/email-approval.service';
import { EmailApprovalRejectionDto } from './dto';

@Controller('email-approval')
export class EmailApprovalController {
  constructor(
    private readonly utilityService: UtilityService,
    private readonly emailApprovalService: EmailApprovalService,
  ) {}

  /**
   * Handle approve action from email
   */
  @Get(':token/approve')
  async approveByEmail(
    @Param('token') token: string,
    @Res() response?: Response,
  ) {
    try {
      const result = await this.emailApprovalService.processEmailAction(
        token,
        'approve',
      );

      // Instead of redirecting, show a result page
      const successHtml = this.renderApprovalResultPage(
        true,
        'approved',
        result.message,
      );
      return response.send(successHtml);
    } catch (error) {
      // Show error page instead of redirecting
      const errorMessage = error.message || 'Failed to process approval';
      const errorHtml = this.renderApprovalResultPage(
        false,
        'failed',
        errorMessage,
      );
      return response.send(errorHtml);
    }
  }

  /**
   * Handle reject action from email (redirect to rejection form)
   */
  @Get(':token/reject')
  async rejectByEmail(
    @Param('token') token: string,
    @Res() response?: Response,
  ) {
    try {
      // Validate token before showing rejection form
      const validation = await this.emailApprovalService.validateToken(token);

      if (!validation.isValid) {
        const errorUrl = this.generateErrorUrl(
          validation.errorMessage || 'Invalid token',
        );
        return response.redirect(errorUrl);
      }

      // Get token information for the form
      const tokenInfo = await this.emailApprovalService.getTokenInfo(token);

      // Render rejection form with token info
      const rejectionFormHtml = await this.renderRejectionForm(
        token,
        tokenInfo,
      );
      return response.send(rejectionFormHtml);
    } catch (error) {
      const errorUrl = this.generateErrorUrl('Failed to load rejection form');
      return response.redirect(errorUrl);
    }
  }

  /**
   * Process rejection with remarks
   */
  @Post(':token/reject')
  async processRejection(
    @Param('token') token: string,
    @Body() body: EmailApprovalRejectionDto,
    @Res() response?: Response,
  ) {
    // Validate that remarks are provided
    if (!body.remarks || body.remarks.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required');
    }

    try {
      const result = await this.emailApprovalService.processEmailAction(
        token,
        'reject',
        body.remarks,
      );

      // Show success page for rejection
      const successHtml = this.renderApprovalResultPage(
        true,
        'rejected',
        result.message,
      );
      return response.send(successHtml);
    } catch (error) {
      // Show error page
      const errorMessage = error.message || 'Failed to process rejection';
      const errorHtml = this.renderApprovalResultPage(
        false,
        'failed',
        errorMessage,
      );
      return response.send(errorHtml);
    }
  }

  /**
   * Get token validation status (API endpoint)
   */
  @Get(':token/validate')
  async validateToken(
    @Param('token') token: string,
    @Res() response?: Response,
  ) {
    const validation = await this.emailApprovalService.validateToken(token);
    return this.utilityService.responseHandler(
      Promise.resolve(validation),
      response,
    );
  }

  /**
   * Get token information (API endpoint)
   */
  @Get(':token/info')
  async getTokenInfo(
    @Param('token') token: string,
    @Res() response?: Response,
  ) {
    const tokenInfo = await this.emailApprovalService.getTokenInfo(token);
    return this.utilityService.responseHandler(
      Promise.resolve(tokenInfo),
      response,
    );
  }

  /**
   * Render rejection form HTML
   */
  private async renderRejectionForm(
    token: string,
    tokenInfo: any,
  ): Promise<string> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rejection Form - ${tokenInfo.task?.title || 'Approval Request'}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f8f9fa;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background-color: #dc3545;
                color: white;
                padding: 20px;
                text-align: center;
            }
            .content {
                padding: 30px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #333;
            }
            textarea {
                width: 100%;
                min-height: 120px;
                padding: 12px;
                border: 2px solid #e9ecef;
                border-radius: 4px;
                font-size: 14px;
                font-family: inherit;
                resize: vertical;
                box-sizing: border-box;
            }
            textarea:focus {
                outline: none;
                border-color: #dc3545;
            }
            .button-group {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 30px;
            }
            .btn {
                padding: 12px 30px;
                border: none;
                border-radius: 4px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                text-align: center;
                transition: all 0.2s;
            }
            .btn-danger {
                background-color: #dc3545;
                color: white;
            }
            .btn-danger:hover {
                background-color: #c82333;
            }
            .btn-secondary {
                background-color: #6c757d;
                color: white;
            }
            .btn-secondary:hover {
                background-color: #5a6268;
            }
            .info-box {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                margin-bottom: 20px;
                border-left: 4px solid #dc3545;
            }
            .info-box h4 {
                margin: 0 0 10px 0;
                color: #dc3545;
            }
            .info-box p {
                margin: 0;
                color: #6c757d;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                }
                .content {
                    padding: 20px;
                }
                .button-group {
                    flex-direction: column;
                }
                .btn {
                    width: 100%;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Rejection Form</h1>
                <p>Please provide a reason for rejecting this request</p>
            </div>
            <div class="content">
                <div class="info-box">
                    <h4>Request Details</h4>
                    <p><strong>Type:</strong> ${tokenInfo.sourceModule || 'Approval Request'}</p>
                    <p><strong>Approver:</strong> ${tokenInfo.approver?.name || 'N/A'}</p>
                    ${tokenInfo.task?.title ? `<p><strong>Title:</strong> ${tokenInfo.task.title}</p>` : ''}
                </div>

                <form action="${baseUrl}/api/email-approval/${token}/reject" method="POST">
                    <div class="form-group">
                        <label for="remarks">Rejection Reason *</label>
                        <textarea 
                            id="remarks" 
                            name="remarks" 
                            placeholder="Please provide a detailed reason for rejecting this request..."
                            required
                        ></textarea>
                    </div>
                    
                    <div class="button-group">
                        <button type="submit" class="btn btn-danger">
                            Submit Rejection
                        </button>
                        <a href="${baseUrl}/member/dashboard" class="btn btn-secondary">
                            Cancel
                        </a>
                    </div>
                </form>
            </div>
        </div>

        <script>
            // Auto-focus on textarea
            document.getElementById('remarks').focus();
            
            // Form validation
            document.querySelector('form').addEventListener('submit', function(e) {
                const remarks = document.getElementById('remarks').value.trim();
                if (!remarks) {
                    e.preventDefault();
                    alert('Please provide a reason for rejection.');
                    document.getElementById('remarks').focus();
                }
            });
        </script>
    </body>
    </html>
    `;
  }

  /**
   * Generate error redirect URL with message
   */
  private generateErrorUrl(message: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const encodedMessage = encodeURIComponent(message);
    return `${baseUrl}/member/dashboard?error=email_approval_failed&message=${encodedMessage}`;
  }

  /**
   * Render approval result page
   */
  private renderApprovalResultPage(
    success: boolean,
    action: string,
    message?: string,
  ): string {
    const statusColor = success ? '#28a745' : '#dc3545';
    const statusIcon = success ? '✓' : '✗';
    const statusText = success ? 'Success' : 'Failed';
    const actionText =
      action === 'approved'
        ? 'Approved'
        : action === 'rejected'
          ? 'Rejected'
          : 'Processed';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Approval ${statusText} - GEER-ANTE ERP</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f8f9fa;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .container {
                max-width: 500px;
                margin: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
                text-align: center;
            }
            .header {
                background-color: ${statusColor};
                color: white;
                padding: 40px 20px;
            }
            .icon {
                font-size: 60px;
                margin-bottom: 20px;
            }
            .content {
                padding: 40px 30px;
            }
            h1 {
                margin: 0 0 10px 0;
                font-size: 28px;
            }
            .status-message {
                font-size: 18px;
                color: #333;
                margin-bottom: 20px;
            }
            .detail-message {
                color: #6c757d;
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 30px;
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 6px;
                border-left: 4px solid ${statusColor};
            }
            .actions {
                margin-top: 30px;
            }
            .btn {
                display: inline-block;
                padding: 12px 30px;
                background-color: #007bff;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                font-size: 16px;
                font-weight: 600;
                transition: background-color 0.2s;
            }
            .btn:hover {
                background-color: #0056b3;
            }
            .logo {
                width: 150px;
                height: auto;
                margin-bottom: 20px;
            }
            .timestamp {
                color: #6c757d;
                font-size: 14px;
                margin-top: 20px;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 0;
                    border-radius: 0;
                    min-height: 100vh;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">${statusIcon}</div>
                <h1>Request ${actionText}</h1>
            </div>
            <div class="content">
                ${
                  success
                    ? `
                    <div class="status-message">
                        Your approval has been successfully processed.
                    </div>
                    <div class="detail-message">
                        The request has been ${actionText.toLowerCase()} and the relevant parties have been notified. 
                        You can close this window or return to your dashboard.
                    </div>
                `
                    : `
                    <div class="status-message">
                        Unable to process your approval request.
                    </div>
                    <div class="detail-message">
                        <strong>Reason:</strong> ${message || 'Unknown error occurred'}
                    </div>
                `
                }
                
                <div class="actions">
                    <a href="#" onclick="window.close(); return false;" class="btn">Close Window</a>
                </div>
                
                <div class="timestamp">
                    Processed on ${new Date().toLocaleString()}
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}
