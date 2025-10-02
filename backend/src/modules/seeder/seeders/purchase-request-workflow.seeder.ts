import { Injectable } from '@nestjs/common';
import { BaseSeeder, SeederMetadata } from './base.seeder';
import { PrismaService } from '@common/prisma.service';
import { purchaseRequestWorkflowTemplate } from '../../../../prisma/seed/templates/purchase-request-workflow.template';

@Injectable()
export class PurchaseRequestWorkflowSeeder extends BaseSeeder {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get type(): string {
    return 'purchase_request_workflow';
  }

  get name(): string {
    return 'Purchase Request Workflow Template';
  }

  get description(): string {
    return 'Creates purchase request workflow template for the company';
  }

  async canSeed(companyId: number): Promise<boolean> {
    // Check if purchase request workflow template already exists for this company
    const existing = await this.prisma.workflowTemplate.findFirst({
      where: {
        companyId,
        code: purchaseRequestWorkflowTemplate.code,
        isDeleted: false,
      },
    });

    return !existing;
  }

  async seed(companyId: number): Promise<SeederMetadata> {
    const metadata: SeederMetadata = {
      totalRecords: 0,
      processedRecords: 0,
      skippedRecords: 0,
      errors: [],
      workflowTemplateId: null,
      stagesCreated: 0,
      transitionsCreated: 0,
      buttonConfigsCreated: 0,
    };

    try {
      await this.prisma.$transaction(async (tx) => {
        // Create the workflow template
        const template = await tx.workflowTemplate.create({
          data: {
            companyId,
            name: purchaseRequestWorkflowTemplate.name,
            code: purchaseRequestWorkflowTemplate.code,
            description: purchaseRequestWorkflowTemplate.description,
            isActive: purchaseRequestWorkflowTemplate.isActive,
            isDefault: purchaseRequestWorkflowTemplate.isDefault,
          },
        });

        metadata.workflowTemplateId = template.id;
        metadata.processedRecords++;

        // Create stages with their IDs tracked for transitions
        const stageMap = new Map<string, number>();

        for (const stage of purchaseRequestWorkflowTemplate.stages) {
          const createdStage = await tx.workflowStage.create({
            data: {
              workflowId: template.id,
              name: stage.name,
              key: stage.code,
              description: stage.description,
              sequence: stage.order,
              color: stage.config?.color || '#808080',
              textColor: stage.config?.textColor || 'white',
              isInitial: stage.stageType === 'INITIAL',
              isFinal: stage.stageType === 'FINAL',
              assigneeType: stage.assigneeType,
              assigneeId: stage.assigneeId,
            },
          });
          stageMap.set(stage.code, createdStage.id);
          metadata.stagesCreated++;
          metadata.processedRecords++;
        }

        // Create transitions
        for (const transition of purchaseRequestWorkflowTemplate.transitions) {
          const fromStageId = stageMap.get(transition.fromStageCode);
          const toStageId = stageMap.get(transition.toStageCode);

          if (fromStageId && toStageId) {
            await tx.workflowTransition.create({
              data: {
                fromStageId,
                toStageId,
                transitionType: 'APPROVAL',
                buttonName: transition.name,
                buttonColor: transition.config?.buttonColor || 'primary',
                conditionType: transition.config?.conditionType,
                conditionData: transition.config?.validationRules,
              },
            });
            metadata.transitionsCreated++;
            metadata.processedRecords++;
          }
        }

        // Create button configs
        if (purchaseRequestWorkflowTemplate.buttonConfigs) {
          for (const buttonConfig of purchaseRequestWorkflowTemplate.buttonConfigs) {
            await tx.workflowButtonConfig.create({
              data: {
                templateId: template.id,
                transitionCode: buttonConfig.transitionCode,
                buttonLabel: buttonConfig.buttonLabel,
                buttonColor: buttonConfig.buttonColor,
                buttonIcon: buttonConfig.buttonIcon,
                buttonSize: buttonConfig.buttonSize || 'medium',
                confirmationRequired:
                  buttonConfig.confirmationRequired || false,
                confirmationTitle: buttonConfig.confirmationTitle,
                confirmationMessage: buttonConfig.confirmationMessage,
                remarkRequired: buttonConfig.remarkRequired || false,
                remarkPrompt: buttonConfig.remarkPrompt,
                position: buttonConfig.position || 0,
                visibility: buttonConfig.visibility || 'ALWAYS',
                customClass: (buttonConfig as any).customClass || null,
              },
            });
            metadata.buttonConfigsCreated++;
            metadata.processedRecords++;
          }
        }

        metadata.totalRecords =
          1 + // template
          purchaseRequestWorkflowTemplate.stages.length +
          purchaseRequestWorkflowTemplate.transitions.length +
          (purchaseRequestWorkflowTemplate.buttonConfigs?.length || 0);
      });

      return metadata;
    } catch (error) {
      metadata.errors!.push(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
      throw error;
    }
  }

  async validate(companyId: number): Promise<boolean> {
    // Check if purchase request workflow template exists
    const template = await this.prisma.workflowTemplate.findFirst({
      where: {
        companyId,
        code: purchaseRequestWorkflowTemplate.code,
        isDeleted: false,
      },
      include: {
        stages: true,
        buttonConfigs: true,
      },
    });

    if (!template) return false;

    // Validate that it has the expected number of stages
    const expectedStageCount = purchaseRequestWorkflowTemplate.stages.length;
    if (template.stages.length !== expectedStageCount) return false;

    // Validate that it has button configs if expected
    const expectedButtonConfigCount =
      purchaseRequestWorkflowTemplate.buttonConfigs?.length || 0;
    if (template.buttonConfigs.length !== expectedButtonConfigCount)
      return false;

    return true;
  }
}
