import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { PosItemResponse, PosItemsListResponse } from '@shared/response/pos.response';

@Injectable()
export class PosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all items enabled for POS for the device's company
   * @param companyId - Company ID from the POS device
   * @returns List of POS-enabled items
   */
  async getPosItems(companyId: number): Promise<PosItemsListResponse> {
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
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    // Format the response
    const formattedItems: PosItemResponse[] = items.map((item) => ({
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
    }));

    return {
      items: formattedItems,
      total: formattedItems.length,
    };
  }
}
