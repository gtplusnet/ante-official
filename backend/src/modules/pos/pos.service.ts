import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { PosItemResponse, PosItemsListResponse } from '@shared/response/pos.response';

@Injectable()
export class PosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all items enabled for POS for the device's company with inventory data
   * @param companyId - Company ID from the POS device
   * @param branchId - Branch ID from the POS device (nullable)
   * @returns List of POS-enabled items with inventory information
   */
  async getPosItems(
    companyId: number,
    branchId: number | null,
  ): Promise<PosItemsListResponse> {
    // Get warehouse inventory if branch has a warehouse
    const inventoryMap = new Map<string, number>();

    if (branchId) {
      const branch = await this.prisma.project.findUnique({
        where: { id: branchId },
        select: { mainWarehouseId: true },
      });

      if (branch?.mainWarehouseId) {
        // Get all inventory for this warehouse
        const inventoryItems = await this.prisma.inventoryItem.findMany({
          where: { warehouseId: branch.mainWarehouseId },
          select: {
            itemId: true,
            stockCount: true,
          },
        });

        // Create map for fast lookup
        inventoryItems.forEach((inv) => {
          inventoryMap.set(inv.itemId, inv.stockCount);
        });
      }
    }

    // Get all items enabled for POS in the company
    const items = await this.prisma.item.findMany({
      where: {
        enabledInPOS: true,
        isDeleted: false,
        isDraft: false,
        companyId: companyId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        groupItems: {
          include: {
            item: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    // Format the response
    const formattedItems: PosItemResponse[] = items.map((item) => {
      const baseItem = {
        id: item.id,
        name: item.name,
        sku: item.sku,
        description: item.description,
        sellingPrice: item.sellingPrice,
        itemType: item.itemType,
        categoryId: item.categoryId,
        categoryName: item.category?.name,
        brandId: item.brandId,
        brandName: item.brand?.name,
        enabledInPOS: item.enabledInPOS,
        uom: item.uom,
        companyId: item.companyId,
        branchId: item.branchId,
      };

      // If item is ITEM_GROUP, include child items (groups don't have inventory)
      if (item.itemType === 'ITEM_GROUP' && item.groupItems?.length > 0) {
        return {
          ...baseItem,
          childItems: item.groupItems.map((groupItem) => ({
            itemId: groupItem.item.id,
            itemName: groupItem.item.name,
            quantity: groupItem.quantity,
            unitPrice: groupItem.item.sellingPrice,
            isIncluded: true,
            stockCount: inventoryMap.get(groupItem.item.id) ?? 0,
          })),
        };
      }

      // For INDIVIDUAL_PRODUCT items, include inventory
      return {
        ...baseItem,
        stockCount: inventoryMap.get(item.id) ?? 0,
      };
    });

    return {
      items: formattedItems,
      total: formattedItems.length,
    };
  }
}
