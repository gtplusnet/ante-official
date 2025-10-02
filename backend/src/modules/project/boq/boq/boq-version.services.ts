import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { PrismaService } from '@common/prisma.service';
import { CreateVersionDTO } from './boq.dto';

@Injectable()
export class BoqVersionService {
  @Inject() private utilityService: UtilityService;
  @Inject() private prisma: PrismaService;

  async list(projectId: number) {
    projectId = Number(projectId);
    const billOfQuantity = await this.prisma.billOfQuantity.findMany({
      where: { projectId },
      include: { sourceBillOfQuantity: true },
      orderBy: { revision: 'asc' },
    });
    const responseList = this.utilityService.mapFormatData(
      billOfQuantity,
      'billOfQuantity',
    );
    return responseList;
  }
  async createVersion(params: CreateVersionDTO) {
    const projectInformation = await this.prisma.project.findUnique({
      where: { id: params.projectId },
    });

    if (!projectInformation) {
      throw new NotFoundException('Project not found');
    }

    const lastBoq = await this.prisma.billOfQuantity.findFirst({
      where: { projectId: params.projectId },
      orderBy: { revision: 'desc' },
    });
    let sourceBoq = null;

    if (params.sourceBoqId) {
      sourceBoq = await this.prisma.billOfQuantity.findUnique({
        where: { id: params.sourceBoqId },
      });

      if (!sourceBoq) {
        throw new NotFoundException('Source Boq not found');
      }

      if (sourceBoq.projectId !== params.projectId) {
        throw new NotFoundException('Source Boq not found in the project');
      }
    } else {
      sourceBoq = lastBoq;
    }

    if (!sourceBoq) {
      throw new NotFoundException('No previous version found');
    }

    const insertData = {
      projectId: params.projectId,
      revision: lastBoq.revision + 1,
      subject: params.versionTitle,
      contractId: sourceBoq.contractId,
      contractLocation: sourceBoq.contractLocation,
      expirationDate: sourceBoq.expirationDate,
      createdAt: new Date(),
      createdById: this.utilityService.accountInformation.id,
      updatedById: this.utilityService.accountInformation.id,
      constractNumber: lastBoq.constractNumber + 1,
      lastKeyUsed: sourceBoq.lastKeyUsed,
      sourceBillOfQuantityId: sourceBoq.id,
    };

    const newBoqVersion = await this.prisma.billOfQuantity.create({
      data: insertData,
    });
    await this.#cloneBoqTable(sourceBoq.id, newBoqVersion.id);
    await this.#cloneBoqTableItems(sourceBoq.id, newBoqVersion.id);

    const formattedProjectInformation = this.utilityService.formatData(
      projectInformation,
      'project',
    );
    const formattedNewBoqVersion = this.utilityService.formatData(
      newBoqVersion,
      'billOfQuantity',
    );

    return {
      projectInformation: formattedProjectInformation,
      newBoqVersion: formattedNewBoqVersion,
    };
  }
  async #cloneBoqTable(previousBillOfQuantityId, newBillOfQuantityId) {
    const previousBoqTable = await this.prisma.billOfQuantityTable.findMany({
      where: { billOfQuantityId: previousBillOfQuantityId },
    });

    previousBoqTable.forEach((table) => {
      delete table.key;
    });

    const insertData = previousBoqTable.map((table) => {
      return {
        ...table,
        billOfQuantityId: newBillOfQuantityId,
      };
    });

    const newBoqTable = await this.prisma.billOfQuantityTable.createMany({
      data: insertData,
    });
    return newBoqTable;
  }
  async #cloneBoqTableItems(previousBillOfQuantityId, newBillOfQuantityId) {
    const previousBoqTableItems =
      await this.prisma.billOfQuantityTableItems.findMany({
        where: { billOfQuantityId: previousBillOfQuantityId },
      });

    previousBoqTableItems.forEach((tableItem) => {
      delete tableItem.id;
    });

    const insertData = previousBoqTableItems.map((tableItem) => {
      return {
        ...tableItem,
        billOfQuantityId: newBillOfQuantityId,
      };
    });

    const newBoqTableItems =
      await this.prisma.billOfQuantityTableItems.createMany({
        data: insertData,
      });
    return newBoqTableItems;
  }
}
