import { Controller } from '@nestjs/common';
import { EmailApprovalController } from './email-approval.controller';

/**
 * API Email Approval Controller
 * Handles email approval routes with /api prefix
 */
@Controller('api/email-approval')
export class ApiEmailApprovalController extends EmailApprovalController {}
