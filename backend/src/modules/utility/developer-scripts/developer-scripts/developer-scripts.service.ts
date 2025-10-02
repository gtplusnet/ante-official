import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { WarehouseType } from '@prisma/client';
import { UtilityService } from '@common/utility.service';
import * as RegionJSON from 'json/table_region.json';
import * as ProvinceJSON from 'json/table_province.json';
import * as MunicipalityJSON from 'json/table_municipality.json';
import * as BarangayJSON from 'json/table_barangay.json';

@Injectable()
export class DeveloperScriptsService {
  @Inject() public prisma: PrismaService;
  @Inject() public utility: UtilityService;

  async resetAll() {
    this.utility.log('Resetting All');
    await this.resetProject();
    await this.resetWarehouse();
    await this.resetItemReceipt();
    await this.initializeDefaults();
  }
  async initializeDefaults() {
    this.utility.log('Initializing Defaults');
    await this.initializeLocation();
    await this.initializeDefaultMainWarehouse();
    await this.initializeInTransitWarehouse();
    await this.intiatializeTemporayWarehouse();
  }
  async initializeLocation() {
    this.utility.log('Initializing Location');

    let queue = [];

    // populate region
    for (const region of RegionJSON) {
      const checkExist = await this.prisma.locationRegion.findFirst({
        where: { id: region.region_id },
      });
      if (!checkExist) {
        queue.push(
          this.prisma.locationRegion.create({
            data: {
              id: region.region_id,
              name: region.region_name,
              description: region.region_description,
            },
          }),
        );

        this.utility.log(`Region (${region.region_name}) created successfully`);
      }
    }

    await Promise.all(queue);

    queue = [];

    // populate province
    for (const province of ProvinceJSON) {
      const checkExist = await this.prisma.locationProvince.findFirst({
        where: { id: province.province_id },
      });
      if (!checkExist) {
        queue.push(
          this.prisma.locationProvince.create({
            data: {
              id: province.province_id,
              regionId: province.region_id,
              name: province.province_name,
              description: province.province_name,
            },
          }),
        );

        this.utility.log(
          `Province (${province.province_name}) created successfully`,
        );
      }
    }

    await Promise.all(queue);

    queue = [];

    // populate municipality
    for (const municipality of MunicipalityJSON) {
      const checkExist = await this.prisma.locationMunicipality.findFirst({
        where: { id: municipality.municipality_id },
      });
      if (!checkExist) {
        queue.push(
          this.prisma.locationMunicipality.create({
            data: {
              id: municipality.municipality_id,
              provinceId: municipality.province_id,
              name: municipality.municipality_name,
              description: municipality.municipality_name,
            },
          }),
        );

        this.utility.log(
          `Municipality (${municipality.municipality_name}) created successfully`,
        );
      }
    }

    await Promise.all(queue);

    // populate barangay
    for (const barangay of BarangayJSON) {
      const checkExist = await this.prisma.locationBarangay.findFirst({
        where: { id: barangay.barangay_id },
      });

      if (!checkExist) {
        await this.prisma.locationBarangay.create({
          data: {
            id: barangay.barangay_id,
            municipalityId: barangay.municipality_id,
            name: barangay.barangay_name,
            description: barangay.barangay_name,
          },
        });

        this.utility.log(
          `Barangay (${barangay.barangay_name}) created successfully`,
        );
      }
    }
  }
  async resetProject() {
    this.utility.log('Resetting Project');
    await this.prisma.billOfQuantityTable.deleteMany({});
    await this.prisma.billOfQuantity.deleteMany({});
    await this.prisma.task.deleteMany({});
    await this.prisma.project.deleteMany({});
  }
  async resetItemReceipt() {
    await this.prisma.itemReceiptItems.deleteMany({});
    await this.prisma.itemReceipt.deleteMany({});
  }
  async resetWarehouse() {
    this.utility.log('Resetting Warehouse');
    await this.prisma.inventoryItem.deleteMany({});
    await this.prisma.delivery.deleteMany({});
    await this.prisma.purchaseRequest.deleteMany({});
    await this.prisma.purchaseOrder.deleteMany({});
    await this.prisma.supplier.deleteMany({});
    await this.prisma.client.deleteMany({});
    await this.prisma.location.deleteMany({});
    await this.prisma.warehouse.deleteMany({});
    await this.initializeDefaultMainWarehouse();
    await this.initializeInTransitWarehouse();
    await this.intiatializeTemporayWarehouse();
  }
  private async intiatializeTemporayWarehouse() {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        name: 'Temporary Warehouse',
        warehouseType: WarehouseType.TEMPORARY_WAREHOUSE,
      },
    });

    if (!warehouse) {
      const initialLocation = await this.prisma.location.findFirst({
        where: { isDefaultLocation: true },
      });

      await this.prisma.warehouse.create({
        data: {
          name: 'Temporary Warehouse',
          size: 1000,
          capacity: 1000,
          location: { connect: { id: initialLocation.id } },
          warehouseType: WarehouseType.TEMPORARY_WAREHOUSE,
        },
      });

      this.utility.log('Temporary Warehouse created successfully');
    } else {
      this.utility.log('Temporary Warehouse already exists');
    }
  }
  private async initializeDefaultMainWarehouse() {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        name: 'Main Warehouse',
        warehouseType: WarehouseType.COMPANY_WAREHOUSE,
        isMainWarehouse: true,
      },
    });

    if (!warehouse) {
      // get random region
      const region = await this.prisma.locationRegion.findFirst();
      const province = await this.prisma.locationProvince.findFirst({
        where: { regionId: region.id },
      });
      const municipality = await this.prisma.locationMunicipality.findFirst({
        where: { provinceId: province.id },
      });
      const barangay = await this.prisma.locationBarangay.findFirst({
        where: { municipalityId: municipality.id },
      });
      const createdLocation = await this.prisma.location.create({
        data: {
          name: 'Main Location',
          isDefaultLocation: true,
          regionId: region.id,
          provinceId: province.id,
          municipalityId: municipality.id,
          barangayId: barangay.id,
          zipCode: '0000',
        },
      });

      await this.prisma.warehouse.create({
        data: {
          name: 'Main Warehouse',
          size: 1000,
          capacity: 1000,
          location: { connect: { id: createdLocation.id } },
          warehouseType: WarehouseType.COMPANY_WAREHOUSE,
          isMainWarehouse: true,
        },
      });

      this.utility.log('Main Warehouse created successfully');
    } else {
      this.utility.log('Main Warehouse already exists');
    }
  }
  private async initializeInTransitWarehouse() {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        name: 'In Transit Warehouse',
        warehouseType: WarehouseType.IN_TRANSIT_WAREHOUSE,
      },
    });

    if (!warehouse) {
      const initialLocation = await this.prisma.location.findFirst({
        where: { isDefaultLocation: true },
      });

      await this.prisma.warehouse.create({
        data: {
          name: 'In Transit Warehouse',
          size: 1000,
          capacity: 1000,
          location: { connect: { id: initialLocation.id } },
          warehouseType: WarehouseType.IN_TRANSIT_WAREHOUSE,
        },
      });

      this.utility.log('In Transit Warehouse created successfully');
    } else {
      this.utility.log('In Transit Warehouse already exists');
    }
  }
  async updateAllAccountSearchKeywords() {
    // Fetch all accounts
    const accounts = await this.prisma.account.findMany({});
    let updatedCount = 0;
    for (const account of accounts) {
      // Generate keyword (same logic as AccountService)
      const searchKeyword = [
        account.firstName?.toLowerCase() || '',
        account.lastName?.toLowerCase() || '',
        account.email?.toLowerCase() || '',
        account.username?.toLowerCase() || '',
      ]
        .join(' ')
        .trim();
      // Only update if different or null
      if (account.searchKeyword !== searchKeyword) {
        await this.prisma.account.update({
          where: { id: account.id },
          data: { searchKeyword },
        });
        updatedCount++;
      }
    }
    this.utility.log(`Updated searchKeyword for ${updatedCount} accounts.`);
    return { updatedCount };
  }

  async testTaskUpdate() {
    this.utility.log('Testing task update event emission');

    // Find any existing task
    const task = await this.prisma.task.findFirst({
      where: { isOpen: true },
    });

    if (!task) {
      // Create a test task if none exists
      const createdTask = await this.prisma.task.create({
        data: {
          title: 'Test Task for Socket Events',
          description: 'This is a test task',
          taskType: 'NORMAL' as const,
          assignMode: 'SELF' as const,
          isSelfAssigned: true,
          isOpen: true,
          order: 999,
          boardLaneId: 1,
          createdById: this.utility.accountInformation.id,
          updatedById: this.utility.accountInformation.id,
        },
      });

      this.utility.log(`Created test task with ID: ${createdTask.id}`);
      return { action: 'created', taskId: createdTask.id };
    }

    // Update the existing task
    const updatedTask = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        description: `Updated at ${new Date().toISOString()}`,
        updatedById: this.utility.accountInformation.id,
      },
    });

    this.utility.log(`Updated task with ID: ${updatedTask.id}`);
    return { action: 'updated', taskId: updatedTask.id };
  }

  async testFilingUpdate() {
    this.utility.log('Testing filing update event emission');

    // Find any existing filing
    const filing = await this.prisma.payrollFiling.findFirst({
      where: {
        status: 'PENDING',
      },
    });

    if (!filing) {
      // Create a test filing if none exists
      const createdFiling = await this.prisma.payrollFiling.create({
        data: {
          filingType: 'LEAVE',
          status: 'PENDING',
          accountId: this.utility.accountInformation.id,
          date: new Date(),
          remarks: 'Test filing for socket events',
        },
      });

      this.utility.log(`Created test filing with ID: ${createdFiling.id}`);
      return { action: 'created', filingId: createdFiling.id };
    }

    // Update the existing filing
    const updatedFiling = await this.prisma.payrollFiling.update({
      where: { id: filing.id },
      data: {
        remarks: `${filing.remarks || ''} - Updated at ${new Date().toISOString()}`,
      },
    });

    this.utility.log(`Updated filing with ID: ${updatedFiling.id}`);
    return { action: 'updated', filingId: updatedFiling.id };
  }
}
