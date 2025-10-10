import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClsModule } from 'nestjs-cls';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '@common/logger';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { isSentryEnabled } from './instrument';

// Core modules
import { CommonModule } from '@common/common.module';
import { HealthModule } from './health/health.module';

// Infrastructure modules
import { TaskQueueModule } from './infrastructure/queues/task-queue.module';

// Feature modules
import { AccountModule } from '@modules/account/account/account.module';
import { CompanyModule } from '@modules/company/company/company.module';
import { UserLevelModule } from '@modules/user/user-level/user-level.module';
import { RoleModule } from '@modules/role/role/role.module';

// HR modules
import { HrConfigurationModule } from '@modules/hr/configuration/hr-configuration/hr-configuration.module';
import { HrisModule } from './hris/hris.module';
import { HrisComputationModule } from '@modules/hr/computation/hris-computation/hris-computation.module';
import { HrProcessingModule } from '@modules/hr/processing/hr-processing/hr-processing.module';
import { HrFilingModule } from '@modules/hr/filing/hr-filing/hr-filing.module';
import { HrTimeImportationModule } from '@modules/hr/timekeeping/hr-time-importation/hr-time-importation.module';
import { TimekeepingRawLogsModule } from '@modules/hr/timekeeping/timekeeping-raw-logs/timekeeping-raw-logs.module';
import { ActionCenterModule } from '@modules/hr/action-center/action-center.module';
import { IndividualScheduleAssignmentModule } from '@modules/hr/individual-schedule-assignment/individual-schedule-assignment.module';
import { TeamModule } from '@modules/hr/team/team.module';

// Project modules
import { ProjectModule } from '@modules/project/project/project/project.module';

// Inventory modules
import { SupplierModule } from '@modules/inventory/supplier/supplier/supplier.module';
import { BrandModule } from '@modules/inventory/brand/brand/brand.module';
import { ItemCategoryModule } from '@modules/inventory/item-category/item-category/item-category.module';
import { PurchaseOrderModule } from '@modules/finance/purchase-order/purchase-order/purchase-order.module';

// Communication modules
import { SocketModule } from '@modules/communication/socket/socket/socket.module';
import { DiscussionModule } from '@modules/communication/discussion/discussion/discussion.module';
import { LeadModule } from '@modules/crm/lead/lead/lead.module';
import { LeadRelationshipOwnerModule } from '@modules/crm/lead-relationship-owner/lead-relationship-owner/lead-relationship-owner.module';
import { PointOfContactModule } from '@modules/crm/point-of-contact/point-of-contact/point-of-contact.module';
import { LeadCompanyModule } from '@modules/crm/lead-company/lead-company/lead-company.module';
import { DealSourceModule } from '@modules/crm/deal-source/deal-source/deal-source.module';
import { DealTypeModule } from '@modules/crm/deal-type/deal-type/deal-type.module';
import { CRMActivityModule } from '@modules/crm/crm-activity/crm-activity/crm-activity.module';
import { NotificationModule } from '@modules/communication/notification/notification/notification.module';
import { OTPModule } from '@modules/communication/otp/otp/otp.module';
import { EmailConfigModule } from '@modules/communication/email-config/email-config.module';
import { EmailModule } from '@modules/communication/email/email.module';
import { EmailApprovalModule } from '@modules/communication/email-approval/email-approval.module';
import { SentEmailModule } from '@modules/communication/sent-email/sent-email.module';
import { AnnouncementModule } from '@modules/communication/announcement/announcement/announcement.module';

// Utility modules
import { SelectOptionsModule } from '@modules/utility/select-options/select-options/select-options.module';

// Infrastructure modules
import { QueueModule } from '@infrastructure/queue/queue/queue.module';
import { MediaQueueModule } from '@infrastructure/queues/media-queue.module';
import { MediaProcessorModule } from '@infrastructure/media-processor/media-processor.module';
import { StorageModule } from '@infrastructure/storage/storage.module';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { SchedulerModule } from '@modules/scheduler/scheduler.module';

// Integration modules
import { AiChatModule } from '@integrations/ai-chat/ai-chat/ai-chat.module';
import { OpenAIProviderModule } from '@integrations/ai-chat/providers/openai/openai.module';

// School modules
import { SchoolModule } from '@modules/school/school.module';

// Approval module
import { ApprovalModule } from '@modules/approval/approval.module';

// Workflow module
import { WorkflowModule } from '@modules/workflow/workflow.module';

// Auth module
import { AuthModule } from '@modules/auth/auth/auth.module';

// Dashboard module
import { DashboardModule } from '@modules/dashboard/dashboard/dashboard.module';

// Seeder module
import { SeederModule } from '@modules/seeder/seeder.module';

// Migration module
import { MigrationModule } from '@modules/migration/migration.module';

// CMS module
import { CMSModule } from '@modules/cms/cms.module';

// Media module (infrastructure)
import { MediaModule } from '@infrastructure/file-upload/media/media.module';

// Time tracking module
import { TimeTrackingModule } from '@modules/time-tracking/time-tracking.module';
import { ManpowerDeviceModule } from '@modules/manpower-device/manpower-device.module';

// App controller
import { AppController } from './app.controller';

// Individual controllers and services that need to be refactored into modules
import { ScopeController } from '@modules/project/scope/scope/scope.controller';
import { RoleGroupController } from '@modules/role/role-group/role-group.controller';
import { UserOrgController } from '@modules/user/user-org/user-org.controller';
import { BoardLaneController } from '@modules/project/board/board-lane/board-lane.controller';
import { TaskController } from '@modules/project/task/task/task.controller';
import { WarehouseController } from '@modules/inventory/warehouse/warehouse/warehouse.controller';
import { InventoryController } from '@modules/inventory/inventory/inventory/inventory.controller';
import { ItemController } from '@modules/inventory/item/item/item.controller';
import { EquipmentController } from './equipment/equipment.controller';
import { LocationController } from '@modules/location/location/location/location.controller';
import { DeliveryController } from '@modules/inventory/delivery/delivery/delivery.controller';
import { FundAccountController } from '@modules/finance/fund-account/fund-account/fund-account.controller';
import { SelectBoxController } from '@modules/utility/select-box/select-box/select-box.controller';
import { ItemReceiptsController } from '@modules/inventory/receipts/item-receipts/item-receipts.controller';
import { DeveloperScriptsController } from '@modules/utility/developer-scripts/developer-scripts/developer-scripts.controller';
import { DeveloperDatabaseController } from '@modules/utility/developer-database/developer-database.controller';
import { ClientController } from '@modules/crm/client/client/client.controller';
import { PublicClientController } from '@modules/crm/client/client/public-client.controller';
import { FileUploadController } from '@infrastructure/file-upload/file-upload/file-upload.controller';
import { BoqController } from '@modules/project/boq/boq/boq.controller';
import { RfpController } from '@modules/finance/rfp/rfp/rfp.controller';
import { PettyCashController } from '@modules/finance/petty-cash/petty-cash/petty-cash.controller';
import { CollectionController } from '@modules/finance/collection/collection/collection.controller';
import { ProjectAccomplishmentController } from '@modules/project/accomplishment/project-accomplishment/project-accomplishment.controller';
import { BranchController } from '@modules/location/branch/branch/branch.controller';
import { CalendarEventController } from '@modules/calendar/calendar-event/calendar-event.controller';
import { CalendarCategoryController } from '@modules/calendar/calendar-category/calendar-category.controller';

// Listeners
import { SocketListener } from './listeners/socket.listener';
import { ListenersModule } from './listeners/listeners.module';

// Services
import { RoleGroupService } from '@modules/role/role-group/role-group.service';
import { ClientService } from '@modules/crm/client/client/client.service';
import { AppInitService } from './app-init.service';
import { UserOrgService } from '@modules/user/user-org/user-org.service';
import { BoardLaneService } from '@modules/project/board/board-lane/board-lane.service';
import { TopicService } from '@modules/communication/topic/topic/topic.service';
import { TaskService } from '@modules/project/task/task/task.service';
import { WarehouseService } from '@modules/inventory/warehouse/warehouse/warehouse.service';
import { InventoryService } from '@modules/inventory/inventory/inventory/inventory.service';
import { ItemService } from '@modules/inventory/item/item/item.service';
import { EquipmentService } from './equipment/equipment.service';
import { LocationService } from '@modules/location/location/location/location.service';
import { DeliveryService } from '@modules/inventory/delivery/delivery/delivery.service';
import { BoqService } from '@modules/project/boq/boq/boq.service';
import { ItemReceiptsService } from '@modules/inventory/receipts/item-receipts/item-receipts.service';
import { FundAccountService } from '@modules/finance/fund-account/fund-account/fund-account.service';
import { SelectBoxService } from '@modules/utility/select-box/select-box/select-box.service';
import { DeveloperScriptsService } from '@modules/utility/developer-scripts/developer-scripts/developer-scripts.service';
import { DeveloperDatabaseService } from '@modules/utility/developer-database/developer-database.service';
import { BoqQtoService } from '@modules/project/boq/boq/boq-qto.services';
import { BoqVersionService } from '@modules/project/boq/boq/boq-version.services';
import { PurchaseOrderService } from '@modules/finance/purchase-order/purchase-order/purchase-order.service';
import { RfpService } from '@modules/finance/rfp/rfp/rfp.service';
import { PettyCashService } from '@modules/finance/petty-cash/petty-cash/petty-cash.service';
import { CollectionService } from '@modules/finance/collection/collection/collection.service';
import { ProjectAccomplishmentService } from '@modules/project/accomplishment/project-accomplishment/project-accomplishment.service';
import { BranchService } from '@modules/location/branch/branch/branch.service';
import { CalendarEventService } from '@modules/calendar/calendar-event/calendar-event.service';
import { CalendarCategoryService } from '@modules/calendar/calendar-category/calendar-category.service';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: winstonConfig.transports,
      format: winstonConfig.format,
    }),
    ConfigModule.forRoot({
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
    }),
    EventEmitterModule.forRoot(),

    // Configure ClsModule for request-scoped context storage
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: () => Math.random().toString(36).substring(2, 15),
      },
    }),

    // Sentry module - only in staging and production
    ...(isSentryEnabled ? [SentryModule.forRoot()] : []),

    // Core
    CommonModule,

    // Auth
    AuthModule,

    // Feature modules with proper organization
    AccountModule,
    CompanyModule,
    UserLevelModule,
    RoleModule,

    // Approval system
    ApprovalModule,

    // Workflow system
    WorkflowModule,

    // HR domain
    HrConfigurationModule,
    HrisModule,
    HrisComputationModule,
    HrProcessingModule,
    HrFilingModule,
    HrTimeImportationModule,
    TimekeepingRawLogsModule,
    ActionCenterModule,
    IndividualScheduleAssignmentModule,
    TeamModule,

    // Project domain
    ProjectModule,

    // Inventory & Finance
    SupplierModule,
    BrandModule,
    ItemCategoryModule,
    PurchaseOrderModule,

    // Communication
    SocketModule,
    DiscussionModule,
    LeadModule,
    LeadRelationshipOwnerModule,
    PointOfContactModule,
    LeadCompanyModule,
    DealSourceModule,
    DealTypeModule,
    CRMActivityModule,
    NotificationModule,
    OTPModule,
    EmailConfigModule,
    EmailModule,
    EmailApprovalModule,
    SentEmailModule,
    AnnouncementModule,

    // Utilities
    SelectOptionsModule,

    // Infrastructure
    QueueModule,
    MediaQueueModule,
    MediaProcessorModule,
    StorageModule,
    RedisModule,
    SchedulerModule,

    // Integrations
    AiChatModule,
    OpenAIProviderModule,

    // School domain
    SchoolModule,

    // Dashboard
    DashboardModule,

    // Listeners
    ListenersModule,

    // Task Queue Processing
    TaskQueueModule,

    // Health check
    HealthModule,

    // Seeder module
    SeederModule,

    // Migration module
    MigrationModule,

    // CMS module
    CMSModule,

    // Media module (infrastructure)
    MediaModule,

    // Time tracking module
    TimeTrackingModule,
    ManpowerDeviceModule,
  ],
  controllers: [
    // Root app controller
    AppController,

    // Controllers that should be moved to their own modules eventually
    ScopeController,
    RoleGroupController,
    UserOrgController,
    BoardLaneController,
    TaskController,
    WarehouseController,
    InventoryController,
    ItemController,
    EquipmentController,
    LocationController,
    DeliveryController,
    FundAccountController,
    SelectBoxController,
    ItemReceiptsController,
    DeveloperScriptsController,
    DeveloperDatabaseController,
    ClientController,
    PublicClientController,
    FileUploadController,
    BoqController,
    RfpController,
    PettyCashController,
    CollectionController,
    ProjectAccomplishmentController,
    BranchController,
    CalendarEventController,
    CalendarCategoryController,
  ],
  providers: [
    // Sentry error filter - only in staging and production
    ...(isSentryEnabled
      ? [
          {
            provide: APP_FILTER,
            useClass: SentryGlobalFilter,
          },
        ]
      : []),

    // App initialization
    AppInitService,

    // Event listeners
    SocketListener,

    // Services that don't have their own modules yet
    // These should eventually be moved to their respective modules
    ClientService,
    UserOrgService,
    BoardLaneService,
    TopicService,
    TaskService,
    WarehouseService,
    InventoryService,
    ItemService,
    EquipmentService,
    LocationService,
    DeliveryService,
    BoqService,
    ItemReceiptsService,
    FundAccountService,
    SelectBoxService,
    DeveloperScriptsService,
    DeveloperDatabaseService,
    BoqQtoService,
    BoqVersionService,
    RfpService,
    PettyCashService,
    CollectionService,
    ProjectAccomplishmentService,
    BranchService,
    CalendarEventService,
    CalendarCategoryService,
    // Add RoleGroupService back for UserOrgService dependency
    RoleGroupService,
    // Add PurchaseOrderService back for EquipmentService dependency
    PurchaseOrderService,
  ],
})
export class AppModule {}
