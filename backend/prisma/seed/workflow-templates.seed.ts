import { PrismaClient } from '@prisma/client';
import { defaultWorkflowTemplates } from './templates';

const prisma = new PrismaClient();

export async function seedWorkflowTemplates(companyId?: number) {
  console.log('🌱 Seeding workflow templates...');
  
  // Get all companies if no specific companyId provided
  const companies = companyId 
    ? [{ id: companyId }] 
    : await prisma.company.findMany({ select: { id: true } });
  
  for (const company of companies) {
    for (const template of defaultWorkflowTemplates) {
      try {
        // Check if template already exists
        const existing = await prisma.workflowTemplate.findUnique({
          where: { 
            companyId_code: {
              companyId: company.id,
              code: template.code
            }
          }
        });
        
        if (!existing) {
          // Create new template with all related entities
          await createWorkflowTemplate(company.id, template);
          console.log(`✅ Created template: ${template.name} for company ${company.id}`);
        } else {
          // Optionally update existing template if version changed
          if (template.version && existing.description?.includes('v') && 
              parseInt(template.version) > parseInt(existing.description.split('v')[1] || '0')) {
            await updateWorkflowTemplate(existing.id, template);
            console.log(`🔄 Updated template: ${template.name} for company ${company.id}`);
          } else {
            console.log(`⏭️  Skipped existing template: ${template.name} for company ${company.id}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error seeding template ${template.name} for company ${company.id}:`, error);
      }
    }
  }
  
  console.log('✨ Workflow template seeding complete');
}

async function createWorkflowTemplate(companyId: number, template: any) {
  return prisma.$transaction(async (tx) => {
    // Create template
    const created = await tx.workflowTemplate.create({
      data: {
        companyId,
        name: template.name,
        code: template.code,
        description: template.description,
        isActive: template.isActive ?? true,
        isDefault: template.isDefault ?? false,
      }
    });
    
    // Create stages with their IDs tracked for transitions
    const stageMap = new Map<string, number>();
    
    for (const stage of template.stages) {
      const createdStage = await tx.workflowStage.create({
        data: {
          workflowId: created.id,
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
        }
      });
      stageMap.set(stage.code, createdStage.id);
    }
    
    // Create transitions
    for (const transition of template.transitions) {
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
          }
        });
      }
    }
    
    // Create button configs
    if (template.buttonConfigs) {
      for (const buttonConfig of template.buttonConfigs) {
        await tx.workflowButtonConfig.create({
          data: {
            templateId: created.id,
            transitionCode: buttonConfig.transitionCode,
            buttonLabel: buttonConfig.buttonLabel,
            buttonColor: buttonConfig.buttonColor,
            buttonIcon: buttonConfig.buttonIcon,
            buttonSize: buttonConfig.buttonSize || 'medium',
            confirmationRequired: buttonConfig.confirmationRequired || false,
            confirmationTitle: buttonConfig.confirmationTitle,
            confirmationMessage: buttonConfig.confirmationMessage,
            remarkRequired: buttonConfig.remarkRequired || false,
            remarkPrompt: buttonConfig.remarkPrompt,
            position: buttonConfig.position || 0,
            visibility: buttonConfig.visibility || 'ALWAYS',
            customClass: buttonConfig.customClass,
          }
        });
      }
    }
    
    return created;
  });
}

async function updateWorkflowTemplate(id: number, newTemplate: any) {
  // For now, just update the description and version
  // In production, you might want to handle more complex updates
  await prisma.workflowTemplate.update({
    where: { id },
    data: {
      description: newTemplate.description,
      updatedAt: new Date()
    }
  });
}

// Helper function to check and seed workflows on startup
export async function checkAndSeedWorkflows() {
  try {
    // Check if any workflow templates exist
    const templateCount = await prisma.workflowTemplate.count();
    
    if (templateCount === 0) {
      console.log('No workflow templates found. Initializing defaults...');
      await seedWorkflowTemplates();
    } else {
      // Check for missing default templates per company
      const companies = await prisma.company.findMany({ select: { id: true } });
      
      for (const company of companies) {
        for (const template of defaultWorkflowTemplates) {
          if (template.isDefault) {
            const exists = await prisma.workflowTemplate.findUnique({
              where: { 
                companyId_code: {
                  companyId: company.id,
                  code: template.code
                }
              }
            });
            
            if (!exists) {
              console.log(`Creating missing default template: ${template.code} for company ${company.id}`);
              await createWorkflowTemplate(company.id, template);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking workflow templates:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  seedWorkflowTemplates()
    .catch((e) => {
      console.error('Error seeding workflow templates:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}