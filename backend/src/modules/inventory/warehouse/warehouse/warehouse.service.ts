import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  WarehouseCreateDTO,
  WarehouseUpdateDTO,
} from '../../../../dto/warehouse.validator';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import warehouseTypeReference from '../../../../reference/warehouse-type.reference';

@Injectable()
export class WarehouseService {
  @Inject() public prisma: PrismaService;
  @Inject() public utility: UtilityService;
  @Inject() public tableHandler: TableHandlerService;

  async searchWarehouseList(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandler.initialize(query, body, 'warehouse');
    const tableQuery = this.tableHandler.constructTableQuery();

    tableQuery['where'] = {
      ...tableQuery['where'],
      isDeleted: false,
      companyId: this.utility.companyId,
    };

    if (query.search) {
      tableQuery['where'] = {
        ...tableQuery['where'],
        AND: [
          tableQuery['where'],
          {
            OR: [{ name: { contains: query.search, mode: 'insensitive' } }],
          },
        ],
      };
    }

    tableQuery['include'] = {
      location: true,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandler.getTableData(
      this.prisma.warehouse,
      query,
      tableQuery,
    );
    const list = baseList.map((warehouse) =>
      this.formatWarehouseResponse(warehouse),
    );
    const formattedList = list.map((warehouse) => ({
      ...warehouse,
      location: warehouse.location,
    }));

    return { list: formattedList, pagination, currentPage };
  }
  async getTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandler.initialize(query, body, 'warehouse');
    const tableQuery = this.tableHandler.constructTableQuery();
    tableQuery['include'] = {
      location: {
        include: {
          region: true,
          province: true,
          municipality: true,
          barangay: true,
        },
      },
      project: true,
    };

    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utility.companyId,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandler.getTableData(
      this.prisma.warehouse,
      query,
      tableQuery,
    );

    const list = baseList.map((warehouse) =>
      this.formatWarehouseResponse(warehouse),
    );

    const responseList = await Promise.all(
      list.map(async (warehouse) => {
        // sum number of items in warehouse
        const itemStockTotal = await this.prisma.inventoryItem.aggregate({
          where: { warehouseId: warehouse.id },
          _sum: { stockCount: true },
        });

        return {
          ...warehouse,
          itemTotal: this.utility.formatNumber(
            itemStockTotal._sum.stockCount || 0,
          ),
        };
      }),
    );

    return { list: responseList, pagination, currentPage };
  }

  async getWarehouseById(id: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id },
      include: {
        location: {
          include: {
            region: true,
            province: true,
            municipality: true,
            barangay: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return this.formatWarehouseResponse(warehouse);
  }

  async createWarehouse(warehouseDto: WarehouseCreateDTO) {
    const existingWarehouse = await this.prisma.warehouse.findFirst({
      where: { name: warehouseDto.name },
    });

    if (existingWarehouse) {
      throw new BadRequestException('Warehouse name already exists.');
    }

    const createWarehouseData: Prisma.WarehouseCreateInput = {
      name: warehouseDto.name,
      size: 0,
      warehouseType: warehouseDto.warehouseType,
      capacity: warehouseDto.capacity,
      company: { connect: { id: this.utility.companyId } },
    };

    if (warehouseDto.locationId) {
      createWarehouseData.location = {
        connect: { id: warehouseDto.locationId },
      };
    }

    if (warehouseDto.projectId) {
      const projectLocation = await this.prisma.project.findFirst({
        where: { id: warehouseDto.projectId },
        select: { locationId: true },
      });

      if (!projectLocation) {
        throw new BadRequestException('Project not found');
      }

      createWarehouseData.location = {
        connect: { id: projectLocation.locationId },
      };

      createWarehouseData.project = {
        connect: { id: warehouseDto.projectId },
      };
    }

    if (warehouseDto.equipmentId) {
      createWarehouseData.equipmentVehicleId = warehouseDto.equipmentId;
    }

    const createResponse = await this.prisma.warehouse.create({
      data: createWarehouseData,
      include: { location: true },
    });

    const responseData = this.formatWarehouseResponse(createResponse);
    return responseData;
  }

  async updateWarehouse(warehouseId: string, updateDto: WarehouseUpdateDTO) {
    // Check if warehouse exists and belongs to the company
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id: warehouseId,
        companyId: this.utility.companyId,
        isDeleted: false,
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // If updating name, check for duplicates
    if (updateDto.name && updateDto.name !== warehouse.name) {
      const existingWarehouse = await this.prisma.warehouse.findFirst({
        where: {
          name: updateDto.name,
          companyId: this.utility.companyId,
          isDeleted: false,
          id: { not: warehouseId },
        },
      });

      if (existingWarehouse) {
        throw new BadRequestException('Warehouse name already exists');
      }
    }

    // Build update data
    const updateData: Prisma.WarehouseUpdateInput = {};

    if (updateDto.name !== undefined) {
      updateData.name = updateDto.name;
    }

    if (updateDto.capacity !== undefined) {
      updateData.capacity = updateDto.capacity;
    }

    if (updateDto.locationId !== undefined) {
      // Verify location exists
      const location = await this.prisma.location.findFirst({
        where: { id: updateDto.locationId },
      });

      if (!location) {
        throw new BadRequestException('Location not found');
      }

      updateData.location = {
        connect: { id: updateDto.locationId },
      };
    }

    // Update the warehouse
    const updatedWarehouse = await this.prisma.warehouse.update({
      where: { id: warehouseId },
      data: updateData,
      include: {
        location: {
          include: {
            region: true,
            province: true,
            municipality: true,
            barangay: true,
          },
        },
        project: true,
      },
    });

    return this.formatWarehouseResponse(updatedWarehouse);
  }

  /**
   * Formats a warehouse response according to the standard format
   */
  private formatWarehouseResponse(warehouse: any): any {
    if (!warehouse) return null;

    return {
      id: warehouse.id,
      name: warehouse.name,
      location: warehouse.location
        ? this.formatLocationResponse(warehouse.location)
        : null,
      project: warehouse.project
        ? this.formatProjectResponse(warehouse.project)
        : null,
      size: warehouse.size,
      capacity: warehouse.capacity,
      createdAt: this.utility.formatDate(warehouse.createdAt),
      updatedAt: this.utility.formatDate(warehouse.updatedAt),
      isDeleted: warehouse.isDeleted,
      warehouseType: warehouseTypeReference.find(
        (ref) => ref.key === warehouse.warehouseType,
      ) || { key: warehouse.warehouseType, label: warehouse.warehouseType },
      isMainWarehouse: warehouse.isMainWarehouse,
    };
  }

  /**
   * Formats a location response
   */
  private formatLocationResponse(location: any): any {
    if (!location) return null;

    return {
      id: location.id,
      name: location.name,
      region: location.region,
      province: location.province,
      municipality: location.municipality,
      barangay: location.barangay,
      zipCode: location.zipCode,
      landmark: location.landmark,
      description: location.description,
      createdAt: this.utility.formatDate(location.createdAt),
      updatedAt: this.utility.formatDate(location.updatedAt),
      isDeleted: location.isDeleted,
    };
  }

  /**
   * Formats a project response
   */
  private formatProjectResponse(project: any): any {
    if (!project) return null;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      budget: this.utility.formatCurrency(project.budget),
      address: project.address,
      isDeleted: project.isDeleted,
      startDate: this.utility.formatDate(project.startDate),
      endDate: this.utility.formatDate(project.endDate),
      status: project.status,
      isLead: project.isLead,
      location: project.location
        ? this.formatLocationResponse(project.location)
        : null,
      client: project.client,
      downpaymentAmount: this.utility.formatCurrency(project.downpaymentAmount),
      retentionAmount: this.utility.formatCurrency(project.retentionAmount),
      totalCollection: this.utility.formatCurrency(project.totalCollection),
      totalCollectionBalance: this.utility.formatCurrency(
        project.totalCollectionBalance,
      ),
      totalCollected: this.utility.formatCurrency(project.totalCollected),
      progressPercentage: project.progressPercentage,
      isProjectStarted: project.isProjectStarted,
      winProbability: project.winProbability,
      personInCharge: project.personInCharge,
    };
  }

  /**
   * Sets a warehouse as the main warehouse for the company
   * @param warehouseId The ID of the warehouse to set as main
   */
  async setMainWarehouse(warehouseId: string) {
    // Check if the warehouse exists and belongs to the company
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id: warehouseId,
        companyId: this.utility.companyId,
        isDeleted: false,
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Check if it's already the main warehouse
    if (warehouse.isMainWarehouse) {
      throw new ConflictException(
        'This warehouse is already set as the main warehouse',
      );
    }

    // Start a transaction to update warehouses
    await this.prisma.$transaction(async (tx) => {
      // Remove main warehouse status from all other warehouses of the company
      await tx.warehouse.updateMany({
        where: {
          companyId: this.utility.companyId,
          isMainWarehouse: true,
          isDeleted: false,
        },
        data: {
          isMainWarehouse: false,
        },
      });

      // Set the selected warehouse as main
      await tx.warehouse.update({
        where: {
          id: warehouseId,
        },
        data: {
          isMainWarehouse: true,
        },
      });
    });

    // Return the updated warehouse
    return this.getWarehouseById(warehouseId);
  }

  /**
   * Get warehouse options for dropdowns (no pagination)
   * Returns all company warehouses of type COMPANY_WAREHOUSE
   */
  async getWarehouseOptions() {
    const warehouses = await this.prisma.warehouse.findMany({
      where: {
        warehouseType: 'COMPANY_WAREHOUSE',
        isDeleted: false,
        companyId: this.utility.companyId,
      },
      select: {
        id: true,
        name: true,
        warehouseType: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return [
      { id: null, name: 'No Warehouse' },
      ...warehouses,
    ];
  }
}
