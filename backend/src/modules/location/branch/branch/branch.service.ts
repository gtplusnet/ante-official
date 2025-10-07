import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { PrismaService } from '@common/prisma.service';
import { Prisma, ProjectStatus } from '@prisma/client';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { BranchCreateDTO } from './branch.interface';
import { BranchDataResponse } from '../../../../shared/response/branch.response';
import { LocationService } from '@modules/location/location/location/location.service';

@Injectable()
export class BranchService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject() public locationService: LocationService;

  async getBranchesTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'branch');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = {
      ...tableQuery['include'],
      parent: true,
      mainWarehouse: true,
      children: {
        where: {
          status: ProjectStatus.BRANCH,
          isDeleted: false,
        },
      },
    };
    tableQuery['where'] = {
      ...tableQuery['where'],
      status: ProjectStatus.BRANCH,
      isDeleted: false,
      company: { id: this.utilityService.companyId },
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.project,
      query,
      tableQuery,
    );

    const formattedList: BranchDataResponse[] = await Promise.all(
      baseList.map(async (branch) => {
        return await this.formatResponse(branch);
      }),
    );

    return { list: formattedList, pagination, currentPage };
  }
  async createBranch(body: BranchCreateDTO) {
    body.id = Number(body.id);
    body.branchCode = body.branchCode.trim().toUpperCase();
    body.branchName = body.branchName.trim();

    // Validate parent if provided
    if (body.parentId) {
      await this.validateParentBranch(body.parentId, body.id);
    }

    const baseParams = {
      name: body.branchName,
      code: body.branchCode,
      description: 'This is a BRANCH',
      status: ProjectStatus.BRANCH,
      budget: 0,
      startDate: new Date(),
      endDate: new Date(),
      location: { connect: { id: body.branchLocationId } },
      company: { connect: { id: this.utilityService.companyId } },
    };

    let response;

    if (body.id) {
      // Update operation
      const updateParams: Prisma.ProjectUpdateInput = {
        ...baseParams,
        ...(body.parentId !== undefined && {
          parent: body.parentId
            ? { connect: { id: body.parentId } }
            : { disconnect: true },
        }),
        ...(body.mainWarehouseId !== undefined && {
          mainWarehouse: body.mainWarehouseId
            ? { connect: { id: body.mainWarehouseId } }
            : { disconnect: true },
        }),
      };

      response = await this.prisma.project.update({
        where: {
          id: Number(body.id),
        },
        data: updateParams,
        include: {
          parent: true,
          children: true,
          mainWarehouse: true,
        },
      });
    } else {
      // Create operation
      const createParams: Prisma.ProjectCreateInput = {
        ...baseParams,
        ...(body.parentId && { parent: { connect: { id: body.parentId } } }),
        ...(body.mainWarehouseId && {
          mainWarehouse: { connect: { id: body.mainWarehouseId } },
        }),
      };

      response = await this.prisma.project.create({
        data: createParams,
        include: {
          parent: true,
          children: true,
          mainWarehouse: true,
        },
      });
    }

    return await this.formatResponse(response);
  }

  async getBranchInformation(id: string) {
    const branch = await this.prisma.project.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        parent: true,
        mainWarehouse: true,
        children: {
          where: {
            status: ProjectStatus.BRANCH,
            isDeleted: false,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const formattedResponse = await this.formatResponse(branch);
    return formattedResponse;
  }

  async getParentBranchOptions(excludeId?: string) {
    // Get all branches that can be parents
    const branches = await this.prisma.project.findMany({
      where: {
        status: ProjectStatus.BRANCH,
        isDeleted: false,
        company: { id: this.utilityService.companyId },
        ...(excludeId && { id: { not: Number(excludeId) } }),
      },
      select: {
        id: true,
        name: true,
        code: true,
        parentId: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Start with "No Parent" option
    const options = [
      {
        id: null,
        name: 'No Parent',
        code: '',
        parentId: null,
      },
    ];

    if (excludeId) {
      // Filter out descendants of the excluded branch
      const validBranches = [];
      for (const branch of branches) {
        const isDescendant = await this.isDescendantOf(
          branch.id,
          Number(excludeId),
        );
        if (!isDescendant) {
          validBranches.push(branch);
        }
      }
      options.push(...validBranches);
    } else {
      // If no excludeId, return all branches
      options.push(...branches);
    }

    return options;
  }

  async getSelectBox() {
    const branches = await this.prisma.project.findMany({
      where: {
        status: ProjectStatus.BRANCH,
        isDeleted: false,
        company: { id: this.utilityService.companyId },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        parentId: true,
      },
    });

    return branches;
  }

  async getBranchTree() {
    // Fetch all branches with their relations
    const branches = await this.prisma.project.findMany({
      where: {
        status: ProjectStatus.BRANCH,
        isDeleted: false,
        company: { id: this.utilityService.companyId },
      },
      include: {
        location: true,
        parent: true,
        mainWarehouse: true,
        children: {
          where: {
            status: ProjectStatus.BRANCH,
            isDeleted: false,
          },
          include: {
            location: true,
            mainWarehouse: true,
            children: {
              where: {
                status: ProjectStatus.BRANCH,
                isDeleted: false,
              },
              include: {
                location: true,
                mainWarehouse: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Build tree structure - only return top-level branches (no parent)
    const topLevelBranches = branches.filter((branch) => !branch.parentId);

    // Format the tree structure
    const formattedTree = await Promise.all(
      topLevelBranches.map(
        async (branch) => await this.formatBranchNode(branch),
      ),
    );

    return formattedTree;
  }

  private async formatBranchNode(branch: any): Promise<any> {
    const location = await this.locationService.getLocationById(
      branch.locationId,
    );

    const node = {
      id: branch.id,
      name: branch.name,
      code: branch.code,
      location: location,
      parentId: branch.parentId,
      mainWarehouse: branch.mainWarehouse ? {
        id: branch.mainWarehouse.id,
        name: branch.mainWarehouse.name,
        warehouseType: branch.mainWarehouse.warehouseType,
      } : undefined,
      createdAt: this.utilityService.formatDate(branch.createdAt),
      updatedAt: this.utilityService.formatDate(branch.updatedAt),
      children: [],
    };

    // Recursively format children
    if (branch.children && branch.children.length > 0) {
      node.children = await Promise.all(
        branch.children.map(
          async (child) => await this.formatBranchNode(child),
        ),
      );
    }

    return node;
  }

  async getBranches(_query: any) {}

  async updateBranch(_id: string, _body: any) {}

  async deleteBranch(id: string): Promise<BranchDataResponse> {
    const branch = await this.prisma.project.findUnique({
      where: {
        id: Number(id),
        status: ProjectStatus.BRANCH,
      },
    });

    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    const response = await this.prisma.project.update({
      where: {
        id: Number(id),
      },
      data: {
        isDeleted: true,
      },
    });

    return await this.formatResponse(response);
  }

  private async formatResponse(data: any): Promise<BranchDataResponse> {
    const location = await this.locationService.getLocationById(
      data.locationId,
    );

    const formattedResponse: BranchDataResponse = {
      id: data.id,
      name: data.name,
      code: data.code,
      status: data.status,
      location: location,
      parentId: data.parentId,
      parent: data.parent ? await this.formatResponse(data.parent) : undefined,
      children: data.children
        ? await Promise.all(
            data.children.map((child) => this.formatResponse(child)),
          )
        : undefined,
      childrenCount: data.children?.length || 0,
      mainWarehouse: data.mainWarehouse ? {
        id: data.mainWarehouse.id,
        name: data.mainWarehouse.name,
        warehouseType: data.mainWarehouse.warehouseType,
      } : undefined,
      createdAt: this.utilityService.formatDate(data.createdAt),
      updatedAt: this.utilityService.formatDate(data.updatedAt),
    };

    return formattedResponse;
  }

  private async validateParentBranch(
    parentId: number,
    currentBranchId?: number,
  ): Promise<void> {
    // Check if parent exists and is a branch
    const parent = await this.prisma.project.findUnique({
      where: { id: parentId },
    });

    if (!parent || parent.status !== ProjectStatus.BRANCH || parent.isDeleted) {
      throw new BadRequestException('Invalid parent branch');
    }

    // Prevent setting itself as parent
    if (currentBranchId && parentId === currentBranchId) {
      throw new BadRequestException('A branch cannot be its own parent');
    }

    // Prevent circular reference - check if the parent is a descendant of current branch
    if (currentBranchId) {
      const isDescendant = await this.isDescendantOf(parentId, currentBranchId);
      if (isDescendant) {
        throw new BadRequestException(
          'Cannot set a child branch as parent (circular reference)',
        );
      }
    }
  }

  private async isDescendantOf(
    branchId: number,
    potentialAncestorId: number,
  ): Promise<boolean> {
    let currentBranch = await this.prisma.project.findUnique({
      where: { id: branchId },
      select: { parentId: true },
    });

    while (currentBranch?.parentId) {
      if (currentBranch.parentId === potentialAncestorId) {
        return true;
      }
      currentBranch = await this.prisma.project.findUnique({
        where: { id: currentBranch.parentId },
        select: { parentId: true },
      });
    }

    return false;
  }
}
