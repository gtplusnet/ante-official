import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  WorkflowStage,
  WorkflowTransition,
  TransitionType,
} from '@prisma/client';
import {
  CreateWorkflowStageDto,
  UpdateWorkflowStageDto,
  CreateWorkflowTransitionDto,
  ReorderStagesDto,
  WorkflowStageWithTransitions,
} from './workflow.interface';

@Injectable()
export class WorkflowStageService {
  constructor(private prisma: PrismaService) {}

  async findAll(workflowId: number): Promise<WorkflowStageWithTransitions[]> {
    return this.prisma.workflowStage.findMany({
      where: { workflowId },
      include: {
        transitionsFrom: {
          include: {
            toStage: true,
          },
        },
        transitionsTo: true,
      },
      orderBy: { sequence: 'asc' },
    });
  }

  async findOne(id: number): Promise<WorkflowStageWithTransitions> {
    const stage = await this.prisma.workflowStage.findUnique({
      where: { id },
      include: {
        workflow: true,
        transitionsFrom: {
          include: {
            toStage: true,
          },
        },
        transitionsTo: true,
      },
    });

    if (!stage) {
      throw new NotFoundException('Workflow stage not found');
    }

    return stage;
  }

  async create(data: CreateWorkflowStageDto): Promise<WorkflowStage> {
    // Verify workflow exists
    const workflow = await this.prisma.workflowTemplate.findUnique({
      where: { id: data.workflowId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow template not found');
    }

    // Check if key already exists in workflow
    const existingKey = await this.prisma.workflowStage.findUnique({
      where: {
        workflowId_key: {
          workflowId: data.workflowId,
          key: data.key,
        },
      },
    });

    if (existingKey) {
      throw new ConflictException(
        `Stage with key '${data.key}' already exists in this workflow`,
      );
    }

    // Check if sequence already exists
    const existingSequence = await this.prisma.workflowStage.findUnique({
      where: {
        workflowId_sequence: {
          workflowId: data.workflowId,
          sequence: data.sequence,
        },
      },
    });

    if (existingSequence) {
      // Shift sequences to make room
      await this.prisma.workflowStage.updateMany({
        where: {
          workflowId: data.workflowId,
          sequence: { gte: data.sequence },
        },
        data: {
          sequence: { increment: 1 },
        },
      });
    }

    // If this is marked as initial, unset other initial stages
    if (data.isInitial) {
      await this.prisma.workflowStage.updateMany({
        where: {
          workflowId: data.workflowId,
          isInitial: true,
        },
        data: { isInitial: false },
      });
    }

    // Validate assignee fields
    if (
      data.assigneeType &&
      data.assigneeType !== 'DIRECT_SUPERVISOR' &&
      !data.assigneeId
    ) {
      throw new BadRequestException(
        'Assignee ID is required when assignee type is not DIRECT_SUPERVISOR',
      );
    }

    return this.prisma.workflowStage.create({
      data,
    });
  }

  async update(
    id: number,
    data: UpdateWorkflowStageDto,
  ): Promise<WorkflowStage> {
    const stage = await this.findOne(id);

    // If updating to initial, unset other initial stages
    if (data.isInitial === true) {
      await this.prisma.workflowStage.updateMany({
        where: {
          workflowId: stage.workflowId,
          isInitial: true,
          id: { not: id },
        },
        data: { isInitial: false },
      });
    }

    // If updating sequence, handle reordering
    if (data.sequence !== undefined && data.sequence !== stage.sequence) {
      await this.handleSequenceUpdate(
        stage.workflowId,
        id,
        stage.sequence,
        data.sequence,
      );
    }

    // Validate assignee fields if provided
    if (
      data.assigneeType &&
      data.assigneeType !== 'DIRECT_SUPERVISOR' &&
      !data.assigneeId
    ) {
      throw new BadRequestException(
        'Assignee ID is required when assignee type is not DIRECT_SUPERVISOR',
      );
    }

    return this.prisma.workflowStage.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        textColor: data.textColor,
        isInitial: data.isInitial,
        isFinal: data.isFinal,
        assigneeType: data.assigneeType,
        assigneeId: data.assigneeId,
        position: data.position,
        // Don't update sequence here as it's handled above
      },
    });
  }

  async delete(id: number): Promise<void> {
    const stage = await this.findOne(id);

    // Check if stage has incoming transitions (except from itself)
    const incomingTransitions = await this.prisma.workflowTransition.count({
      where: {
        toStageId: id,
        fromStageId: { not: id },
      },
    });

    if (incomingTransitions > 0) {
      throw new BadRequestException(
        'Cannot delete stage with incoming transitions',
      );
    }

    // Delete in transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete all transitions for this stage
      await tx.workflowTransition.deleteMany({
        where: {
          OR: [{ fromStageId: id }, { toStageId: id }],
        },
      });

      // Delete the stage
      await tx.workflowStage.delete({
        where: { id },
      });

      // Reorder remaining stages
      await tx.workflowStage.updateMany({
        where: {
          workflowId: stage.workflowId,
          sequence: { gt: stage.sequence },
        },
        data: {
          sequence: { decrement: 1 },
        },
      });
    });
  }

  async reorderStages(
    workflowId: number,
    data: ReorderStagesDto,
  ): Promise<void> {
    // Verify all stages belong to the workflow
    const stages = await this.prisma.workflowStage.findMany({
      where: {
        workflowId,
        id: { in: data.stages.map((s) => s.id) },
      },
    });

    if (stages.length !== data.stages.length) {
      throw new BadRequestException('Invalid stage IDs provided');
    }

    // Update sequences in transaction
    await this.prisma.$transaction(
      data.stages.map((stage) =>
        this.prisma.workflowStage.update({
          where: { id: stage.id },
          data: { sequence: stage.sequence },
        }),
      ),
    );
  }

  async createTransition(
    data: CreateWorkflowTransitionDto,
  ): Promise<WorkflowTransition> {
    // Verify stages exist and belong to same workflow
    const fromStage = await this.prisma.workflowStage.findUnique({
      where: { id: data.fromStageId },
    });

    if (!fromStage) {
      throw new NotFoundException('From stage not found');
    }

    if (data.toStageId) {
      const toStage = await this.prisma.workflowStage.findUnique({
        where: { id: data.toStageId },
      });

      if (!toStage) {
        throw new NotFoundException('To stage not found');
      }

      if (fromStage.workflowId !== toStage.workflowId) {
        throw new BadRequestException(
          'Stages must belong to the same workflow',
        );
      }
    }

    // Allow multiple transitions between the same stages
    // Each transition can have different button names and dialog configurations

    return this.prisma.workflowTransition.create({
      data: {
        fromStageId: data.fromStageId,
        toStageId: data.toStageId,
        transitionType:
          (data.transitionType as TransitionType) || TransitionType.APPROVAL,
        buttonName: data.buttonName,
        buttonColor: data.buttonColor,
        dialogType: data.dialogType,
        customDialogConfig: data.customDialogConfig,
        conditionType: data.conditionType,
        conditionData: data.conditionData,
        fromSide: data.fromSide,
        toSide: data.toSide,
      },
    });
  }

  async updateTransition(id: number, data: any): Promise<WorkflowTransition> {
    const transition = await this.prisma.workflowTransition.findUnique({
      where: { id },
    });

    if (!transition) {
      throw new NotFoundException('Transition not found');
    }

    return this.prisma.workflowTransition.update({
      where: { id },
      data: {
        buttonName: data.buttonName,
        buttonColor: data.buttonColor,
        dialogType: data.dialogType,
        customDialogConfig: data.customDialogConfig,
        conditionType: data.conditionType,
        conditionData: data.conditionData,
      },
    });
  }

  async deleteTransition(id: number): Promise<void> {
    const transition = await this.prisma.workflowTransition.findUnique({
      where: { id },
    });

    if (!transition) {
      throw new NotFoundException('Transition not found');
    }

    await this.prisma.workflowTransition.delete({
      where: { id },
    });
  }

  private async handleSequenceUpdate(
    workflowId: number,
    stageId: number,
    oldSequence: number,
    newSequence: number,
  ): Promise<void> {
    if (oldSequence === newSequence) return;

    await this.prisma.$transaction(async (tx) => {
      if (newSequence > oldSequence) {
        // Moving down: decrease sequence of stages between old and new position
        await tx.workflowStage.updateMany({
          where: {
            workflowId,
            sequence: {
              gt: oldSequence,
              lte: newSequence,
            },
            id: { not: stageId },
          },
          data: {
            sequence: { decrement: 1 },
          },
        });
      } else {
        // Moving up: increase sequence of stages between new and old position
        await tx.workflowStage.updateMany({
          where: {
            workflowId,
            sequence: {
              gte: newSequence,
              lt: oldSequence,
            },
            id: { not: stageId },
          },
          data: {
            sequence: { increment: 1 },
          },
        });
      }

      // Update the stage's sequence
      await tx.workflowStage.update({
        where: { id: stageId },
        data: { sequence: newSequence },
      });
    });
  }
}
