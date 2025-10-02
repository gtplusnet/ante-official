import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplierDTO } from '../../../../dto/supplier.validator.dto';
import { PrismaService } from '@common/prisma.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UtilityService } from '@common/utility.service';
import { Prisma } from '@prisma/client';
import taxTypeReference from '../../../../reference/tax-type.reference';
import paymentTermsReference from '../../../../reference/payment-terms.reference';

@Injectable()
export class SupplierService {
  @Inject() public utilityService: UtilityService;
  @Inject() public prisma: PrismaService;
  @Inject() public tableHandlerService: TableHandlerService;

  async updateSupplier(id: number, updateSupplierDto: CreateSupplierDTO) {
    await this.validateSupplierId(id);

    const supplier: Prisma.SupplierUncheckedUpdateInput = {
      name: updateSupplierDto.name,
      email: updateSupplierDto.email,
      contactNumber: updateSupplierDto.contactNumber,
      locationId: updateSupplierDto.locationId.toString(),
      taxType: updateSupplierDto.taxType,
      paymentTerms: updateSupplierDto.paymentTerms,
    };

    return await this.prisma.supplier.update({
      where: { id },
      data: supplier,
    });
  }
  async getSupplierItemsTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'supplierItems');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = { supplier: true, item: true };
    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.supplierItems,
      query,
      tableQuery,
    );
    const formattedList = baseList.map((item) =>
      this.formatSupplierItemsResponse(item),
    );

    return { list: formattedList, pagination, currentPage };
  }
  async getSupplierPriceUpdateTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'supplierPriceUpdate');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = { supplier: true, item: true, updateBy: true };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.supplierPriceUpdate,
      query,
      tableQuery,
    );
    const formattedList = baseList.map((item) =>
      this.formatSupplierPriceUpdateResponse(item),
    );

    return { list: formattedList, pagination, currentPage };
  }
  async updateSupplierPrice(itemId: string, supplierId: number, price: number) {
    price = Number(price);

    // insert price update log
    await this.prisma.supplierPriceUpdate.create({
      data: {
        supplierId,
        itemId,
        supplierPrice: price,
        updateById: this.utilityService.accountInformation.id,
      },
    });

    // update price
    await this.prisma.supplierItems.upsert({
      where: { supplierId_itemId: { supplierId, itemId } },
      update: { supplierPrice: price },
      create: { supplierId, itemId, supplierPrice: price },
    });

    await this.updatePriceOfItemBasedOnEachSupplier(itemId);
  }

  async createSupplier(createSupplierDto: CreateSupplierDTO) {
    const supplier: Prisma.SupplierUncheckedCreateInput =
      await this.prisma.supplier.create({
        data: {
          name: createSupplierDto.name,
          email: createSupplierDto.email,
          contactNumber: createSupplierDto.contactNumber,
          locationId: createSupplierDto.locationId.toString(),
          taxType: createSupplierDto.taxType,
          paymentTerms: createSupplierDto.paymentTerms,
          companyId: this.utilityService.companyId,
        },
      });

    return supplier;
  }

  async getSupplierTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'supplier');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utilityService.companyId,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.supplier,
      query,
      tableQuery,
    );
    const formattedList = baseList.map((supplier) =>
      this.formatSupplierResponse(supplier),
    );
    const list = await Promise.all(
      formattedList.map(async (supplier) => {
        const payableAmount: number = await this.getSupplierPayableAmount(
          supplier.id,
        );
        supplier.payableAmount =
          this.utilityService.formatCurrency(payableAmount);
        return supplier;
      }),
    );

    return { list, pagination, currentPage };
  }
  async getSupplierPayableAmount(supplierId: number): Promise<number> {
    supplierId = Number(supplierId);

    const responseBalance = await this.prisma.purchaseOrder.aggregate({
      where: { itemReceipt: { supplierId: supplierId, isSettled: false } },
      _sum: { balance: true },
    });
    const returnAmount = responseBalance._sum.balance || 0;
    return returnAmount;
  }

  async getSupplierById(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
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

    if (!supplier || supplier.isDeleted) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    const formattedSupplier = this.formatSupplierResponse(supplier);

    return formattedSupplier;
  }

  async softDeleteSupplier(id: number) {
    await this.validateSupplierId(id);

    return await this.prisma.supplier.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
  private async validateSupplierId(id: number): Promise<void> {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier || supplier.isDeleted)
      throw new NotFoundException(`Supplier ${id} not found`);
  }
  private async updatePriceOfItemBasedOnEachSupplier(itemId: string) {
    // get supplier item list
    const itemList = await this.prisma.supplierItems.findMany({
      where: { itemId },
    });

    // get average rate of item
    const sum = itemList.reduce((acc, item) => acc + item.supplierPrice, 0);
    const averageRate = Number((sum / itemList.length).toFixed(2));

    await this.prisma.item.update({
      where: { id: itemId },
      data: { estimatedBuyingPrice: averageRate },
    });
  }

  /**
   * Formats a supplier response according to the standard format
   */
  private formatSupplierResponse(supplier: any): any {
    if (!supplier) return null;

    return {
      id: supplier.id,
      name: supplier.name,
      contactNumber: supplier.contactNumber,
      email: supplier.email,
      taxType: taxTypeReference.find((ref) => ref.key === supplier.taxType) || {
        key: supplier.taxType,
        label: supplier.taxType,
      },
      paymentTerms: paymentTermsReference.find(
        (ref) => ref.key === supplier.paymentTerms,
      ) || { key: supplier.paymentTerms, label: supplier.paymentTerms },
      location: supplier.location
        ? this.formatLocationResponse(supplier.location)
        : null,
      isDeleted: supplier.isDeleted,
      createdAt: this.utilityService.formatDate(supplier.createdAt),
      updatedAt: this.utilityService.formatDate(supplier.updatedAt),
    };
  }

  /**
   * Formats a supplier items response
   */
  private formatSupplierItemsResponse(supplierItems: any): any {
    if (!supplierItems) return null;

    return {
      supplierPrice: this.utilityService.formatCurrency(
        supplierItems.supplierPrice,
      ),
      updatedAt: this.utilityService.formatDate(supplierItems.updatedAt),
      supplier: supplierItems.supplier
        ? this.formatSupplierResponse(supplierItems.supplier)
        : null,
      item: supplierItems.item
        ? this.formatItemResponse(supplierItems.item)
        : null,
    };
  }

  /**
   * Formats a supplier price update response
   */
  private formatSupplierPriceUpdateResponse(update: any): any {
    if (!update) return null;

    return {
      id: update.id,
      supplier: update.supplier
        ? this.formatSupplierResponse(update.supplier)
        : null,
      item: update.item ? this.formatItemResponse(update.item) : null,
      supplierPrice: this.utilityService.formatCurrency(update.supplierPrice),
      updateBy: update.updateBy
        ? this.formatAccountResponse(update.updateBy)
        : null,
      createdAt: this.utilityService.formatDate(update.createdAt),
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
      createdAt: this.utilityService.formatDate(location.createdAt),
      updatedAt: this.utilityService.formatDate(location.updatedAt),
      isDeleted: location.isDeleted,
    };
  }

  /**
   * Formats an item response
   */
  private formatItemResponse(item: any): any {
    if (!item) return null;

    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      description: item.description,
      estimatedBuyingPrice: this.utilityService.formatCurrency(
        item.estimatedBuyingPrice,
      ),
      sellingPrice: this.utilityService.formatCurrency(item.sellingPrice),
      minimumStockLevelPrice: this.utilityService.formatCurrency(
        item.minimumStockLevelPrice,
      ),
      maximumStockLevelPrice: this.utilityService.formatCurrency(
        item.maximumStockLevelPrice,
      ),
      size: item.size,
      isVariation: item.isVariation,
      parent: item.parent,
      isDeleted: item.isDeleted,
      isDraft: item.isDraft,
      createdAt: this.utilityService.formatDate(item.createdAt),
      updatedAt: this.utilityService.formatDate(item.updatedAt),
      uom: item.uom,
    };
  }

  /**
   * Formats an account response
   */
  private formatAccountResponse(account: any): any {
    if (!account) return null;

    return {
      id: account.id,
      email: account.email,
      username: account.username,
      firstName: account.firstName,
      middleName: account.middleName,
      lastName: account.lastName,
      contactNumber: account.contactNumber,
      status: account.status,
      createdAt: this.utilityService.formatDate(account.createdAt),
      role: account.role,
      parentAccountId: account.parentAccountId,
      image: account.image,
      parent: account.parent
        ? this.formatAccountResponse(account.parent)
        : null,
    };
  }
}
