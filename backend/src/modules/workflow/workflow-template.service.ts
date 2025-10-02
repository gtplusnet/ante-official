import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { WorkflowTemplate, AssigneeType } from '@prisma/client';
import {
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  WorkflowTemplateWithStages,
  CloneWorkflowDto,
  DialogOption,
} from './workflow.interface';
import { getDialogsForWorkflow } from '../../reference/workflow-dialogs';

@Injectable()
export class WorkflowTemplateService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: number) {
    return this.prisma.workflowTemplate.findMany({
      where: {
        companyId,
        isDeleted: false,
      },
      include: {
        stages: {
          orderBy: { sequence: 'asc' },
          include: {
            transitionsFrom: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(
    id: number,
    companyId: number,
  ): Promise<WorkflowTemplateWithStages> {
    const workflow = await this.prisma.workflowTemplate.findFirst({
      where: {
        id,
        companyId,
        isDeleted: false,
      },
      include: {
        stages: {
          orderBy: { sequence: 'asc' },
          include: {
            transitionsFrom: {
              include: {
                toStage: true,
              },
            },
            transitionsTo: true,
          },
        },
      },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow template not found');
    }

    return workflow;
  }

  async findByCode(
    code: string,
    companyId: number,
  ): Promise<WorkflowTemplateWithStages | null> {
    return this.prisma.workflowTemplate.findFirst({
      where: {
        companyId,
        code,
        isDeleted: false,
      },
      include: {
        stages: {
          orderBy: { sequence: 'asc' },
          include: {
            transitionsFrom: {
              include: {
                toStage: true,
              },
            },
            transitionsTo: true,
          },
        },
      },
    });
  }

  async create(
    data: CreateWorkflowTemplateDto,
    companyId: number,
  ): Promise<WorkflowTemplate> {
    // Check if code already exists for this company (excluding deleted)
    const existing = await this.prisma.workflowTemplate.findFirst({
      where: {
        companyId,
        code: data.code,
        isDeleted: false,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Workflow with code '${data.code}' already exists`,
      );
    }

    return this.prisma.workflowTemplate.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async update(
    id: number,
    data: UpdateWorkflowTemplateDto,
    companyId: number,
  ): Promise<WorkflowTemplate> {
    await this.findOne(id, companyId);

    return this.prisma.workflowTemplate.update({
      where: { id },
      data,
    });
  }

  async delete(
    id: number,
    companyId: number,
    deletedById: string,
  ): Promise<void> {
    const workflow = await this.findOne(id, companyId);

    // Check if workflow is in use (this can be expanded based on your needs)
    if (workflow.isDefault) {
      throw new BadRequestException('Cannot delete default workflow');
    }

    // Soft delete instead of hard delete
    await this.prisma.workflowTemplate.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById,
      },
    });
  }

  async restore(id: number, companyId: number): Promise<WorkflowTemplate> {
    // Find the deleted workflow
    const workflow = await this.prisma.workflowTemplate.findFirst({
      where: {
        id,
        companyId,
        isDeleted: true,
      },
    });

    if (!workflow) {
      throw new NotFoundException('Deleted workflow template not found');
    }

    // Check if code conflict exists with active workflows
    const existing = await this.prisma.workflowTemplate.findFirst({
      where: {
        companyId,
        code: workflow.code,
        isDeleted: false,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Cannot restore: Workflow with code '${workflow.code}' already exists`,
      );
    }

    // Restore the workflow
    return this.prisma.workflowTemplate.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedById: null,
      },
    });
  }

  async findDeleted(companyId: number) {
    return this.prisma.workflowTemplate.findMany({
      where: {
        companyId,
        isDeleted: true,
      },
      include: {
        deletedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        stages: {
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async clone(
    data: CloneWorkflowDto,
    companyId: number,
  ): Promise<WorkflowTemplate> {
    const sourceWorkflow = await this.findOne(data.sourceWorkflowId, companyId);

    // Check if new code already exists (excluding deleted)
    const existing = await this.prisma.workflowTemplate.findFirst({
      where: {
        companyId,
        code: data.code,
        isDeleted: false,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Workflow with code '${data.code}' already exists`,
      );
    }

    // Create new workflow with stages and transitions
    return this.prisma.$transaction(async (tx) => {
      // Create workflow template
      const newWorkflow = await tx.workflowTemplate.create({
        data: {
          companyId,
          name: data.name,
          code: data.code,
          description: data.description || sourceWorkflow.description,
          isActive: false, // Start as inactive
        },
      });

      // Map old stage IDs to new stage IDs
      const stageIdMap = new Map<number, number>();

      // Clone stages
      for (const stage of sourceWorkflow.stages) {
        const newStage = await tx.workflowStage.create({
          data: {
            workflowId: newWorkflow.id,
            name: stage.name,
            key: stage.key,
            description: stage.description,
            color: stage.color,
            textColor: stage.textColor,
            sequence: stage.sequence,
            isInitial: stage.isInitial,
            isFinal: stage.isFinal,
            assigneeType: stage.assigneeType,
            assigneeId: stage.assigneeId,
          },
        });
        stageIdMap.set(stage.id, newStage.id);
      }

      // Clone transitions
      for (const stage of sourceWorkflow.stages) {
        for (const transition of stage.transitionsFrom) {
          await tx.workflowTransition.create({
            data: {
              fromStageId: stageIdMap.get(transition.fromStageId)!,
              toStageId: transition.toStageId
                ? stageIdMap.get(transition.toStageId)
                : null,
              transitionType: transition.transitionType,
              buttonName: transition.buttonName,
              buttonColor: transition.buttonColor,
              dialogType: transition.dialogType,
              customDialogConfig: transition.customDialogConfig,
              conditionType: transition.conditionType,
              conditionData: transition.conditionData,
              fromSide: transition.fromSide,
              toSide: transition.toSide,
            },
          });
        }
      }

      return newWorkflow;
    });
  }

  async toggle(id: number, companyId: number): Promise<WorkflowTemplate> {
    const workflow = await this.findOne(id, companyId);

    return this.prisma.workflowTemplate.update({
      where: { id },
      data: { isActive: !workflow.isActive },
    });
  }

  async getAvailableDialogs(workflowCode: string): Promise<DialogOption[]> {
    const dialogOptions = getDialogsForWorkflow(workflowCode);

    return dialogOptions.map((dialog) => ({
      type: dialog.type,
      name: dialog.name,
      description: dialog.description,
      isCommon: dialog.isCommon,
      supportsRejection: dialog.supportsRejection,
      configSchema: dialog.configSchema,
    }));
  }

  async getAssigneeOptions(companyId: number) {
    // Get departments (roles with null parentRoleId) with user count
    const departments = await this.prisma.role.findMany({
      where: {
        companyId,
        parentRoleId: null,
        isDeleted: false,
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    // Get all roles (including sub-roles) with user count
    const roles = await this.prisma.role.findMany({
      where: {
        companyId,
        isDeleted: false,
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    // Get all users with role information
    const users = await this.prisma.account.findMany({
      where: {
        companyId,
        isDeleted: false,
      },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      assigneeTypes: [
        { value: AssigneeType.DEPARTMENT, label: 'Department' },
        { value: AssigneeType.ROLE, label: 'Role' },
        { value: AssigneeType.SPECIFIC_USER, label: 'Specific User' },
        { value: AssigneeType.DIRECT_SUPERVISOR, label: 'Direct Supervisor' },
      ],
      departments: departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        description: dept.description || '',
        userCount: dept._count.users,
      })),
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description || '',
        parentRoleId: role.parentRoleId,
        userCount: role._count.users,
      })),
      users: users.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        roleName: user.role?.name,
      })),
    };
  }
}
