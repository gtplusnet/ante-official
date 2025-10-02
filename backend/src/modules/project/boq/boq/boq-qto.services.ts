import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { PrismaService } from '@common/prisma.service';
import { InsertQuantityTakeOffItemDTO } from './boq.dto';
import { BoqService } from './boq.service';
import { BoqInsertReferenceMethod } from 'interfaces/boq/boqInsertData';

@Injectable()
export class BoqQtoService {
  @Inject() private utilityService: UtilityService;
  @Inject() private prisma: PrismaService;
  @Inject() private boqService: BoqService;

  async insertItem(params: InsertQuantityTakeOffItemDTO) {
    const boqTableData = await this.#getBoqTable(params.key);
    let mode = 'insert';

    // check if item already exists
    const existingItem = await this.prisma.billOfQuantityTableItems.findFirst({
      where: {
        billOfQuantityId: boqTableData.billOfQuantityId,
        billOfQuantityTableKey: boqTableData.key,
        itemId: params.itemId,
      },
    });

    let response = null;

    if (existingItem) {
      mode = 'update';
      response = await this.prisma.billOfQuantityTableItems.update({
        where: { id: existingItem.id },
        data: { amount: params.amount },
      });
    } else {
      response = await this.prisma.billOfQuantityTableItems.create({
        data: {
          billOfQuantity: { connect: { id: boqTableData.billOfQuantityId } },
          billOfQuantityTable: { connect: { key: boqTableData.key } },
          item: { connect: { id: params.itemId } },
          amount: params.amount,
        },
      });
    }

    return { mode, response };
  }
  async removeSelection(id: number) {
    id = Number(id);
    const checkExist = await this.prisma.billOfQuantityTableItems.findUnique({
      where: { id },
    });

    if (!checkExist) {
      throw new ForbiddenException(
        'Item not found or has already been removed.',
      );
    }

    const response = await this.prisma.billOfQuantityTableItems.delete({
      where: { id },
    });

    return response;
  }
  async optionList(key: number, searchKeyword: string) {
    await this.#getBoqTable(key);
    const boqItemList = await this.#getItems(key);

    const itemIds = boqItemList.map((item) => item.itemId);

    const where = {};

    // only items with estimated buying price
    where['isDeleted'] = false;
    where['estimatedBuyingPrice'] = { not: null };

    if (searchKeyword) {
      searchKeyword = searchKeyword.toLowerCase();
      where['OR'] = [
        { description: { contains: searchKeyword, mode: 'insensitive' } },
        { name: { contains: searchKeyword, mode: 'insensitive' } },
        { sku: { contains: searchKeyword, mode: 'insensitive' } },
      ];
    }

    // show all except items already added
    if (itemIds.length) {
      where['NOT'] = { id: { in: itemIds } };
    }

    let itemList = await this.prisma.item.findMany({ where });

    // map format data
    itemList = await Promise.all(
      itemList.map(async (item) => {
        // if parent has parent, get parent uom
        if (item.parent) {
          const parentItem = await this.prisma.item.findUnique({
            where: { id: item.parent },
          });
          item['uom'] = parentItem.uom;
        }

        return item;
      }),
    );

    const formattedItemList = this.utilityService.mapFormatData(
      itemList,
      'item',
    );
    return formattedItemList;
  }
  async selectionList(key: number) {
    await this.#getBoqTable(key);
    const boqItemList = await this.#getItems(key);
    const responseList = this.utilityService.mapFormatData(
      boqItemList,
      'boqItem',
    );
    return responseList;
  }
  async submit(key: number) {
    if (!key) {
      throw new ForbiddenException('Bill of Quantity Table key is required');
    }

    const boqTableData = await this.#getBoqTable(key);
    const boqItemList = await this.#getItems(key);

    // check if there are items to submit
    if (boqTableData.approvalStatus === 'PENDING') {
      const itemInformation = await this.prisma.billOfQuantityTable.findUnique({
        where: { key },
      });
      let itemUnitCost = 0;

      // clear original boq items
      const originalItems = await this.prisma.billOfQuantityTable.findMany({
        where: {
          billOfQuantityId: itemInformation.billOfQuantityId,
          parentId: itemInformation.id,
        },
      });
      for (const originalItem of originalItems) {
        await this.boqService.deleteItem(itemInformation.billOfQuantityId, {
          itemId: originalItem.id,
        });
      }

      const qtoItems = await this.prisma.billOfQuantityTableItems.findMany({
        where: { billOfQuantityTableKey: key },
        include: { item: true },
      });

      // insert boq items
      for (const qtoItem of qtoItems) {
        const itemData = {
          insertReferenceMethod: BoqInsertReferenceMethod.INSIDE,
          insertReferenceId: itemInformation.id,
          insertValue: {
            itemId: qtoItem.itemId,
            description: qtoItem.item.name,
            materialUnitCost: qtoItem.item.estimatedBuyingPrice,
            materialUnit: qtoItem.item.uom,
            quantity: qtoItem.amount,
            manPowerCost: 0,
            laborUnitCost: 0,
            isQuantityTakeOffItem: true,
          },
        };

        itemUnitCost += qtoItem.item.estimatedBuyingPrice * qtoItem.amount;

        // update status
        await this.prisma.billOfQuantityTable.update({
          where: { key },
          data: { approvalStatus: 'NO_ITEM', isQuantityTakeOff: true },
        });

        await this.boqService.addItem(qtoItem.billOfQuantityId, itemData);
      }

      const itemProfitOrLoss = itemInformation.materialTotalCost - itemUnitCost;

      // check if there is profit or loss (description calculated but not used yet)
      if (itemProfitOrLoss > 0) {
        // Profit detected
      } else {
        // Loss detected
      }
    } else {
      // check if there are items to submit
      if (!boqItemList.length) {
        throw new ForbiddenException('No items to submit');
      }

      // update approval status
      await this.prisma.billOfQuantityTable.update({
        where: { key },
        data: { approvalStatus: 'PENDING' },
      });
      this.boqService.sendLatestBoqInformationToSocket(
        boqTableData.billOfQuantityId,
      );
    }

    return boqTableData;
  }
  async #getItems(key: number) {
    const boqTableKey = Number(key);
    const itemList = await this.prisma.billOfQuantityTableItems.findMany({
      where: { billOfQuantityTableKey: boqTableKey },
      include: { item: true },
    });
    return itemList;
  }
  async #getBoqTable(key: number) {
    const boqTableKey = Number(key);
    const boqTable = await this.prisma.billOfQuantityTable.findUnique({
      where: { key: boqTableKey },
    });

    if (!boqTable) {
      throw new NotFoundException('Bill of Quantity Table not found.');
    }

    return boqTable;
  }
}
