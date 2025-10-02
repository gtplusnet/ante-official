import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { ActionButton } from '../interfaces';
import { EmailTemplateRenderResponse } from '@shared/response';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class TemplateEngineService {
  private readonly logger = new Logger(TemplateEngineService.name);
  private templateCache = new Map<string, HandlebarsTemplateDelegate>();
  private readonly templatesPath = path.join(__dirname, '../templates');

  constructor(private readonly utilityService: UtilityService) {
    this.registerHelpers();
    this.logger.log(`Templates path: ${this.templatesPath}`);
    // Register partials on startup
    this.registerPartials().catch((error) => {
      this.logger.error('Failed to register partials on startup:', error);
    });
  }

  /**
   * Render email template with approval data
   */
  async renderTemplate(
    templateName: string,
    approvalData: Record<string, any>,
    token: string,
    approverName: string,
    approverEmail: string,
  ): Promise<EmailTemplateRenderResponse> {
    try {
      // Get base URL from environment or default
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      // Create template data - spread approvalData at root level for direct access
      const templateData: any = {
        ...approvalData, // Spread all approval data at root level for direct access in templates
        approver: {
          name: approverName,
          email: approverEmail,
        },
        company: {
          name: 'GEER-ANTE ERP',
        },
        approval: {
          title: this.getApprovalTitle(templateName),
          description: this.getApprovalDescription(templateName, approvalData),
          details: approvalData,
          actions: this.generateActionButtons(token, baseUrl),
        },
        baseUrl,
        token,
      };

      // Load and compile template
      const template = await this.getTemplate(templateName);
      const htmlContent = template(templateData);

      // Generate subject based on template
      const subject = this.generateSubject(templateName, approvalData);

      return {
        subject,
        htmlContent,
        templateName,
      };
    } catch (error) {
      this.logger.error(`Failed to render template ${templateName}:`, error);
      throw new NotFoundException(
        `Template ${templateName} not found or failed to render`,
      );
    }
  }

  /**
   * Get compiled template from cache or load and compile
   */
  private async getTemplate(
    templateName: string,
  ): Promise<HandlebarsTemplateDelegate> {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    // Load and compile template
    const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
    const templateSource = await this.loadTemplate(templatePath);
    const template = Handlebars.compile(templateSource);

    // Cache compiled template
    this.templateCache.set(templateName, template);
    return template;
  }

  /**
   * Load template from file system
   */
  private async loadTemplate(templatePath: string): Promise<string> {
    try {
      this.logger.log(`Loading template from: ${templatePath}`);
      const content = await fs.readFile(templatePath, 'utf-8');
      this.logger.log(`Successfully loaded template: ${templatePath}`);
      return content;
    } catch (error) {
      this.logger.error(`Failed to load template from ${templatePath}:`, error);
      // Try to load generic template as fallback
      if (!templatePath.includes('generic-approval')) {
        const genericPath = path.join(
          this.templatesPath,
          'generic-approval.hbs',
        );
        this.logger.log(`Trying fallback generic template: ${genericPath}`);
        return await fs.readFile(genericPath, 'utf-8');
      }
      throw error;
    }
  }

  /**
   * Generate action buttons for email template
   */
  private generateActionButtons(
    token: string,
    baseUrl: string,
  ): ActionButton[] {
    return [
      {
        action: 'approve',
        label: 'Approve',
        url: `${baseUrl}/api/email-approval/${token}/approve`,
        style:
          'background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;',
        type: 'primary',
      },
      {
        action: 'reject',
        label: 'Reject',
        url: `${baseUrl}/api/email-approval/${token}/reject`,
        style:
          'background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-left: 10px;',
        type: 'danger',
      },
    ];
  }

  /**
   * Generate email subject based on template and data
   */
  private generateSubject(
    templateName: string,
    approvalData: Record<string, any>,
  ): string {
    switch (templateName) {
      case 'payroll-approval':
        return `Payroll Approval Required - ${approvalData.payrollGroup || 'Payroll'} (${approvalData.dateRange || ''})`;
      case 'hr-filing-approval':
      case 'hr-filing-official-business':
      case 'hr-filing-certificate-attendance':
      case 'hr-filing-overtime':
      case 'hr-filing-schedule-adjustment':
      case 'hr-filing-leave':
        return `${approvalData.filingTypeLabel || 'HR Filing'} - Approval Required`;
      default:
        return `Approval Required - ${approvalData.title || 'Request'}`;
    }
  }

  /**
   * Generate approval title based on template
   */
  private getApprovalTitle(templateName: string): string {
    switch (templateName) {
      case 'payroll-approval':
        return `Payroll Approval Required`;
      case 'hr-filing-approval':
        return `HR Filing Approval Required`;
      default:
        return 'Approval Required';
    }
  }

  /**
   * Generate approval description based on template
   */
  private getApprovalDescription(
    templateName: string,
    approvalData: Record<string, any>,
  ): string {
    switch (templateName) {
      case 'payroll-approval':
        return `Please review and approve the payroll for ${approvalData.payrollGroup || 'the selected group'} covering ${approvalData.dateRange || 'the specified period'}.`;
      case 'hr-filing-approval':
        return `Please review and approve the ${approvalData.filingType || 'filing'} request submitted by ${approvalData.employeeName || 'an employee'}.`;
      default:
        return 'Please review the request and take appropriate action.';
    }
  }

  /**
   * Register Handlebars partials
   */
  private async registerPartials(): Promise<void> {
    try {
      const componentsPath = path.join(this.templatesPath, 'components');
      const files = await fs.readdir(componentsPath);

      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const partialName = file.replace('.hbs', '');
          const partialPath = path.join(componentsPath, file);
          const partialContent = await fs.readFile(partialPath, 'utf-8');
          Handlebars.registerPartial(partialName, partialContent);
          this.logger.log(`Registered partial: ${partialName}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to register partials:', error);
    }
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Helper to format currency
    Handlebars.registerHelper('formatCurrency', (amount: number) => {
      if (typeof amount !== 'number') return '₱0.00';
      return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    });

    // Helper to format date
    Handlebars.registerHelper('formatDate', (date: string | Date) => {
      if (!date) return '';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    // Helper for conditional rendering
    Handlebars.registerHelper(
      'ifEquals',
      function (arg1: any, arg2: any, options: any) {
        return arg1 == arg2 ? options.fn(this) : options.inverse(this);
      },
    );

    // Helper for equality comparison (eq)
    Handlebars.registerHelper(
      'eq',
      function (arg1: any, arg2: any, options: any) {
        return arg1 === arg2 ? options.fn(this) : options.inverse(this);
      },
    );

    // Helper for less than comparison (lt)
    Handlebars.registerHelper(
      'lt',
      function (arg1: any, arg2: any, options: any) {
        return arg1 < arg2 ? options.fn(this) : options.inverse(this);
      },
    );

    // Helper for greater than comparison (gt)
    Handlebars.registerHelper(
      'gt',
      function (arg1: any, arg2: any, options: any) {
        return arg1 > arg2 ? options.fn(this) : options.inverse(this);
      },
    );

    // Helper for number formatting
    Handlebars.registerHelper('formatNumber', (num: number) => {
      if (typeof num !== 'number') return '0';
      return num.toLocaleString('en-US');
    });
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache(): void {
    this.templateCache.clear();
    this.logger.log('Template cache cleared');
  }
}
