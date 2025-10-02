import { Injectable } from '@nestjs/common';
import { BaseSeeder, SeederMetadata } from './base.seeder';
import { PrismaService } from '@common/prisma.service';
import { liquidationWorkflowTemplate } from '../../../../prisma/seed/templates/liquidation-workflow.template';

@Injectable()
export class LiquidationWorkflowSeeder extends BaseSeeder {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get type(): string {
    return 'liquidation_workflow';
  }

  get name(): string {
    return 'Liquidation Workflow Template';
  }

  get description(): string {
    return 'Creates petty cash liquidation workflow template for the company';
  }

  async canSeed(companyId: number): Promise<boolean> {
    // Check if liquidation workflow template already exists for this company
    const existing = await this.prisma.workflowTemplate.findFirst({
      where: {
        companyId,
        code: liquidationWorkflowTemplate.code,
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
            name: liquidationWorkflowTemplate.name,
            code: liquidationWorkflowTemplate.code,
            description: liquidationWorkflowTemplate.description,
            isActive: liquidationWorkflowTemplate.isActive,
            isDefault: liquidationWorkflowTemplate.isDefault,
          },
        });

        metadata.workflowTemplateId = template.id;
        metadata.processedRecords++;

        // Create stages with their IDs tracked for transitions
        const stageMap = new Map<string, number>();

        for (const stage of liquidationWorkflowTemplate.stages) {
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
        for (const transition of liquidationWorkflowTemplate.transitions) {
          const fromStageId = stageMap.get(transition.fromStageCode);
          const toStageId = stageMap.get(transition.toStageCode);

          if (fromStageId && toStageId) {
            const transitionData: any = {
              fromStageId,
              toStageId,
              transitionType: 'APPROVAL',
              buttonName: transition.name,
              buttonColor: transition.config?.buttonColor || '#1976D2',
              dialogType: transition.dialogType || 'reason_dialog',
            };

            // Add optional fields if they exist
            if ((transition.config as any)?.conditionType) {
              transitionData.conditionType = (
                transition.config as any
              ).conditionType;
            }
            if ((transition.config as any)?.validationRules) {
              transitionData.conditionData = (
                transition.config as any
              ).validationRules;
            }
            if ((transition.config as any)?.customDialogConfig) {
              transitionData.customDialogConfig = (
                transition.config as any
              ).customDialogConfig;
            }

            await tx.workflowTransition.create({
              data: transitionData,
            });
            metadata.transitionsCreated++;
            metadata.processedRecords++;
          }
        }

        // Create button configs
        if (liquidationWorkflowTemplate.buttonConfigs) {
          for (const buttonConfig of liquidationWorkflowTemplate.buttonConfigs) {
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
          liquidationWorkflowTemplate.stages.length +
          liquidationWorkflowTemplate.transitions.length +
          (liquidationWorkflowTemplate.buttonConfigs?.length || 0);
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
    // Check if liquidation workflow template exists
    const template = await this.prisma.workflowTemplate.findFirst({
      where: {
        companyId,
        code: liquidationWorkflowTemplate.code,
        isDeleted: false,
      },
      include: {
        stages: true,
        buttonConfigs: true,
      },
    });

    if (!template) return false;

    // Validate that it has the expected number of stages
    const expectedStageCount = liquidationWorkflowTemplate.stages.length;
    if (template.stages.length !== expectedStageCount) return false;

    // Validate that it has button configs if expected
    const expectedButtonConfigCount =
      liquidationWorkflowTemplate.buttonConfigs?.length || 0;
    if (template.buttonConfigs.length !== expectedButtonConfigCount)
      return false;

    return true;
  }
}
