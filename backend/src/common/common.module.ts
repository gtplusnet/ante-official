import { EncryptionService } from '@common/encryption.service';
import { RoleService } from '@modules/role/role/role.service';
import { ScopeService } from '@modules/project/scope/scope/scope.service';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ExistsConstraint } from './validators/exists.validator';
import { UniqueConstraint } from './validators/unique.validator';
import { UtilityService } from './utility.service';
import { TableHandlerService } from './table.handler/table.handler.service';
import { ExternalFetchService } from '@integrations/external-fetch/external-fetch/external-fetch.service';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { FileUploadService } from '@infrastructure/file-upload/file-upload/file-upload.service';
import { AccountService } from '@modules/account/account/account.service';
import { UploadPhotoService } from '@infrastructure/file-upload/upload-photo/upload-photo.service';
import { RoleGroupService } from '@modules/role/role-group/role-group.service';
import { CompanyService } from '@modules/company/company/company.service';
import { TelegramService } from '@modules/communication/telegram/telegram/telegram.service';
import { ExcelExportService } from '@common/services/excel-export.service';
import { ExcelModule } from '@common/services/excel/excel.module';
import { BenchmarkService } from './benchmark.service';
import { RedisModule } from '@infrastructure/redis/redis.module';
@Module({
  imports: [ExcelModule, RedisModule],
  providers: [
    PrismaService,
    UtilityService,
    TableHandlerService,
    ExternalFetchService,
    EncryptionService,
    RoleService,
    RoleGroupService,
    ScopeService,
    ExistsConstraint,
    UniqueConstraint,
    FileUploadService,
    AccountService,
    UploadPhotoService,
    CompanyService,
    TelegramService,
    ExcelExportService, // Keep for backward compatibility
    BenchmarkService,
  ],
  exports: [
    PrismaService,
    UtilityService,
    TableHandlerService,
    ExternalFetchService,
    EncryptionService,
    RoleService,
    ScopeService,
    ExistsConstraint,
    UniqueConstraint,
    FileUploadService,
    AccountService,
    UploadPhotoService,
    CompanyService,
    TelegramService,
    ExcelExportService, // Keep for backward compatibility
    ExcelModule,
    BenchmarkService,
  ],
})
export class CommonModule implements NestModule {
  async configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        // Public auth endpoints (no authentication required)
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/login/google', method: RequestMethod.POST },
        { path: 'auth/login/facebook', method: RequestMethod.POST },
        { path: 'auth/signup', method: RequestMethod.POST },
        { path: 'auth/verify-email/:token', method: RequestMethod.GET },
        { path: 'auth/invite/verify/:token', method: RequestMethod.GET },
        { path: 'auth/invite/accept', method: RequestMethod.POST },
        { path: 'auth/invite/accept-google', method: RequestMethod.POST },
        { path: 'auth/invite/accept-facebook', method: RequestMethod.POST },
        // Guardian auth endpoints
        { path: 'api/guardian/auth/(.*)', method: RequestMethod.ALL },
        // Add specific routes just to be sure
        { path: 'api/guardian/auth/login', method: RequestMethod.POST },
        { path: 'api/guardian/auth/register', method: RequestMethod.POST },
        { path: 'api/guardian/auth/refresh-token', method: RequestMethod.POST },
        {
          path: 'api/guardian/auth/forgot-password',
          method: RequestMethod.POST,
        },
        {
          path: 'api/guardian/auth/reset-password',
          method: RequestMethod.POST,
        },
        // Guardian protected endpoints (use GuardianAuthGuard instead)
        { path: 'api/guardian/(.*)', method: RequestMethod.ALL },
        { path: 'api/notifications/(.*)', method: RequestMethod.ALL },
        { path: 'api/notifications', method: RequestMethod.ALL },
        // Add root path as public (redirects to API docs)
        { path: '', method: RequestMethod.GET },
        // Add health endpoints as public
        { path: 'health', method: RequestMethod.GET },
        { path: 'health/version', method: RequestMethod.GET },
        // Add email approval endpoints as public (no authentication needed)
        { path: 'email-approval/(.*)', method: RequestMethod.ALL },
        { path: 'email-approval', method: RequestMethod.ALL },
        // School sync endpoints (use DeviceLicenseMiddleware instead)
        { path: 'auth/school/sync/(.*)', method: RequestMethod.ALL },
        // Public CMS API endpoints (use ApiKeyGuard instead)
        { path: 'api/public/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
