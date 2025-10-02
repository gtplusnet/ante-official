import { Module, forwardRef } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { WorkflowTemplateController } from './workflow-template.controller';
import { WorkflowTemplateService } from './workflow-template.service';
import { WorkflowStageController } from './workflow-stage.controller';
import { WorkflowStageService } from './workflow-stage.service';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowInstanceService } from './workflow-instance.service';
import { WorkflowTaskService } from './workflow-task.service';
import { WorkflowValidatorService } from './workflow-validator.service';
import { WorkflowInstanceController } from './workflow-instance.controller';
import { ProjectModule } from '@modules/project/project/project/project.module';
import { NotificationModule } from '@modules/communication/notification/notification/notification.module';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => ProjectModule), // For TaskService
    forwardRef(() => NotificationModule), // For NotificationService
  ],
  controllers: [
    WorkflowTemplateController,
    WorkflowStageController,
    WorkflowInstanceController,
  ],
  providers: [
    WorkflowTemplateService,
    WorkflowStageService,
    WorkflowEngineService,
    WorkflowInstanceService,
    WorkflowTaskService,
    WorkflowValidatorService,
  ],
  exports: [
    WorkflowTemplateService,
    WorkflowStageService,
    WorkflowEngineService,
    WorkflowInstanceService,
    WorkflowTaskService,
    WorkflowValidatorService,
  ],
})
export class WorkflowModule {}
