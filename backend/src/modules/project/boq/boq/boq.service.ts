import { Inject, Injectable } from '@nestjs/common';
import { SocketService } from '@modules/communication/socket/socket/socket.service';
import { UtilityService } from '@common/utility.service';
import { PrismaService } from '@common/prisma.service';
import { BoqRoomInterface } from '../../../../shared/response/boqRoom.interface';
import { BoqInformationInterface } from '../../../../shared/response/boqInformation.interface';
import { BoqInsertReferenceMethod } from 'interfaces/boq/boqInsertData';
import { BoqItemInterface } from '../../../../shared/response/boqItem.interface';
import {
  BoqInsertData,
  BoqUpdateData,
  BoqMoveData,
} from 'interfaces/boq/boqInsertData';
import {
  ApprovalStatus,
  BillOfQuantity,
  BoqType,
  Prisma,
  BillOfQuantityStatus,
} from '@prisma/client';
import { BoqFormUpsertDTO } from '@modules/project/boq/boq/boq.dto';
import { BOQDataResponse } from '../../../../shared/response/boq.response';

@Injectable()
export class BoqService {
  @Inject() private socketService: SocketService;
  @Inject() private utilityService: UtilityService;
  @Inject() private prisma: PrismaService;

  public boqRooms = new Map<string, BoqRoomInterface>();

  async lockBoq(boqId: number, isLock: number): Promise<void> {
    const roomId = 'boq-' + boqId;
    await this.joinRoom(boqId);
    const status = isLock
      ? BillOfQuantityStatus.LOCKED
      : BillOfQuantityStatus.PENDING;
    const roomInformation: BoqRoomInterface = this.boqRooms.get(roomId);
    roomInformation.boqInformation.status = status;
    this.utilityService.log(
      `${this.utilityService.accountInformation.username} has changed the Room Status (${roomId} - ${status})`,
    );

    await this.socketService.sendToRoom(roomId, 'BOQ_DATA', roomInformation);
    await this.prisma.billOfQuantity.update({
      where: { id: boqId },
      data: { status: status },
    });
  }

  async changeColor(boqId: number, params): Promise<void> {
    const itemId: number = params.itemId;
    const color: string = params.color;

    const roomId = 'boq-' + boqId;
    await this.joinRoom(boqId);

    // Get the room information
    const roomInformation: BoqRoomInterface = this.boqRooms.get(roomId);

    // Check if the room is empty
    if (roomInformation) {
      const targetItem = this.findList(
        roomInformation.boqItems,
        (item) => item.id == itemId,
      );

      if (targetItem) {
        targetItem.color = color;

        this.saveItemToDB(boqId, targetItem);
        this.socketService.sendToRoom(roomId, 'BOQ_DATA', roomInformation);
        this.utilityService.log(
          `${this.utilityService.accountInformation.username} has changed the color of an Item#${itemId} of Room (${roomId})`,
        );
      }
    }
  }
  async getLatestBoqOfProject(projectId: number): Promise<BOQDataResponse> {
    const boqInformation = await this.prisma.billOfQuantity.findFirst({
      where: { projectId: projectId },
      orderBy: { createdAt: 'desc' },
    });
    const boqResponseInformation = this.formatBillOfQuantityResponse(
      boqInformation,
    ) as BOQDataResponse;
    return boqResponseInformation;
  }
  async createBoqForm(
    insertBoqForm: BoqFormUpsertDTO,
  ): Promise<BillOfQuantity> {
    // Create Initial BOQ
    const createBoqData: Prisma.BillOfQuantityCreateInput = {
      Project: {
        connect: {
          id: insertBoqForm.projectId,
        },
      },
      contractId: insertBoqForm.contractId,
      subject: insertBoqForm.subject,
      contractLocation: insertBoqForm.contractLocation,
      expirationDate: new Date(insertBoqForm.expirationDate),
    };
    const responseBoqForm = await this.prisma.billOfQuantity.create({
      data: createBoqData,
    });
    this.utilityService.log(
      `${this.utilityService.accountInformation.username} has created a new BOQ form.`,
    );
    return responseBoqForm;
  }
  async joinRoom(boqId: number): Promise<void> {
    const roomId = 'boq-' + boqId;
    let roomInformation: BoqRoomInterface;

    // Check if the room is already joined
    if (this.boqRooms.has(roomId)) {
      roomInformation = this.boqRooms.get(roomId);
    } else {
      roomInformation = await this.getRoomInformation(boqId);
    }

    // Join the room
    if (this.socketService && this.socketService.io) {
      // Only join room if we have an active WebSocket connection
      if (this.socketService.socket) {
        await this.socketService.joinRoom(roomId);
      }
      await this.boqRooms.set(roomId, roomInformation);
      await this.updateNumerals(roomId, roomInformation.boqItems);
      await this.socketService.sendToRoom(roomId, 'BOQ_DATA', roomInformation);
    } else {
      // Just set the room information without WebSocket operations
      await this.boqRooms.set(roomId, roomInformation);
      await this.updateNumerals(roomId, roomInformation.boqItems);
    }
  }

  exitRoom(boqId: string): void {
    const roomId = 'boq-' + boqId;

    // Leave the room
    this.socketService.exitRoom(roomId);

    // Check if the room is empty
    if (!this.socketService.isRoomExist(roomId)) {
      this.boqRooms.delete(roomId);
    }

    this.utilityService.log(
      `${this.utilityService.accountInformation.username}has left the room with key ${roomId}`,
    );
  }

  async updateBoqInformation(
    boqId: number,
    boqInformation: BoqInformationInterface,
  ) {
    const roomId = 'boq-' + boqId;
    await this.joinRoom(boqId);

    // Get the room information
    const roomInformation: BoqRoomInterface = this.boqRooms.get(roomId);

    // Check if the room is empty
    if (roomInformation) {
      roomInformation.boqInformation.contractId = boqInformation.contractId;
      roomInformation.boqInformation.subject = boqInformation.subject;
      roomInformation.boqInformation.contractLocation =
        boqInformation.contractLocation;
      roomInformation.boqInformation.expirationDate =
        boqInformation.expirationDate;

      this.socketService.sendToRoom(roomId, 'BOQ_DATA', roomInformation);
      this.utilityService.log(
        `${this.utilityService.accountInformation.username} has updated the information of Room (${roomId})`,
      );
    }
  }

  async reloadBoq(boqId: number) {
    const roomId = 'boq-' + boqId;
    const roomInformation: BoqRoomInterface =
      await this.getRoomInformation(boqId);
    // Check if the room is empty
    if (roomInformation) {
      await this.socketService.joinRoom(roomId);
      await this.boqRooms.set(roomId, roomInformation);
      await this.updateNumerals(roomId, roomInformation.boqItems);
      await this.socketService.sendToRoom(roomId, 'BOQ_DATA', roomInformation);
    }
    this.utilityService.log(
      `${this.utilityService.accountInformation.username} has reloaded the Room (${roomId})`,
    );
  }

  async sendLatestBoqInformationToSocket(boqId: number) {
    const roomId = 'boq-' + boqId;
    await this.joinRoom(boqId);

    // Get the room information
    const roomInformation: BoqRoomInterface = this.boqRooms.get(roomId);

    // Check if the room is empty
    if (roomInformation) {
      this.socketService.sendToRoom(roomId, 'BOQ_DATA', roomInformation);
    }

    this.utilityService.log(
      `${this.utilityService.accountInformation.username} has requested the latest information of Room (${roomId})`,
    );
  }

  async deleteItem(boqId: number, params): Promise<void> {
    const roomId = 'boq-' + boqId;
    await this.joinRoom(boqId);

    // Get the room information
    const roomInformation: BoqRoomInterface = this.boqRooms.get(roomId);
    const itemId = params.itemId;

    // Check if the room is empty
    if (roomInformation) {
      const targetItem = this.findList(
        roomInformation.boqItems,
        (item) => item.id == itemId,
      );

      if (targetItem) {
        this.removeItemOnRoomInformation(roomId, targetItem.id);
        this.removeTargetItemFromDatabase(boqId, targetItem.id);
        await this.recursiveUpdateBoqItems(roomInformation.boqItems);
        await this.updateNumerals(roomId, roomInformation.boqItems);

        this.utilityService.log(
          `${this.utilityService.accountInformation.username} has deleted an Item#${targetItem.id} of Room (${roomId})`,
        );
        this.sendLatestBoqInformationToSocket(boqId);
      } else {
        this.utilityService.log(
          `${this.utilityService.accountInformation.username} has failed to delete an Item#${itemId} of Room (${roomId})`,
        );
      }
    }
  }
  async editItem(boqId: number, boqUpdate: BoqUpdateData): Promise<void> {
    const roomId = 'boq-' + boqId;

    await this.joinRoom(boqId);

    // Get the room information
    const roomInformation: BoqRoomInterface = this.boqRooms.get(roomId);

    // Check if the room is empty
    if (roomInformation) {
      const boqItem = this.findList(
        roomInformation.boqItems,
        (item) => item.id == boqUpdate.updateId,
      );
      const oldItemData = JSON.parse(JSON.stringify(boqItem));

      if (boqItem) {
        boqItem.description = boqUpdate.updateValue.description;
        boqItem.materialUnit = boqUpdate.updateValue.materialUnit;
        boqItem.quantity = boqUpdate.updateValue.quantity;
        boqItem.materialUnitCost = boqUpdate.updateValue.materialUnitCost;
        boqItem.laborUnitCost = boqUpdate.updateValue.laborUnitCost;
        boqItem.itemId = boqUpdate.updateValue.itemId || null;
        boqItem.laborPercentageCost = boqUpdate.updateValue.laborPercentageCost;

        // Update Profit Margin Percentage
        if (
          oldItemData.profitMarginPercentage !=
          boqUpdate.updateValue.profitMarginPercentage
        ) {
          if (boqItem.children.length > 0) {
            await this.recursiveUpdateAllChildProfitMarginRecursively(
              boqItem,
              boqItem,
              boqUpdate.updateValue.profitMarginPercentage,
            );
          } else {
            boqItem.profitMarginPercentage =
              boqUpdate.updateValue.profitMarginPercentage;
          }
        }

        // Update Labor Cost Percentage
        if (
          oldItemData.laborPercentageCost !=
          boqUpdate.updateValue.laborPercentageCost
        ) {
          if (boqItem.children.length > 0) {
            await this.recursiveUpdateAllChildLaborCostPercentageRecursively(
              boqItem,
              boqItem,
              boqUpdate.updateValue.laborPercentageCost,
            );
          } else {
            boqItem.laborPercentageCost =
              boqUpdate.updateValue.laborPercentageCost;
          }
        }

        await this.recursiveUpdateBoqItems(roomInformation.boqItems);
        await this.updateNumerals(roomId, roomInformation.boqItems);

        this.socketService.sendToRoom(roomId, 'BOQ_DATA', roomInformation);
        await this.saveItemToDB(boqId, boqItem);
        await this.recursiveUpsertBoqItemToDatabase(
          roomInformation.boqInformation.id,
          roomInformation.boqItems,
        );
        this.socketService.sendToRoom(roomId, 'BOQ_DATA', roomInformation);
        this.utilityService.log(
          `${this.utilityService.accountInformation.username}has edited an Item#${boqUpdate.updateId} of Room (${roomId})`,
        );
      }
    }
  }
  async recursiveComputeParentProfitMargin(
    boqId: number,
    boqItem: BoqItemInterface,
  ): Promise<void> {
    const roomInformation: BoqRoomInterface = this.boqRooms.get('boq-' + boqId);
    if (boqItem.parentId) {
      const parentItem = this.findList(
        roomInformation.boqItems,
        (item) => item.id == boqItem.parentId,
      );
      // Compute the profit margin based on the children

      this.recursiveComputeParentProfitMargin(boqId, parentItem);
    }
  }
  async recursiveUpdateAllChildLaborCostPercentageRecursively(
    boqId: number,
    boqItem: BoqItemInterface,
    laborPercentageCost: number,
  ): Promise<void> {
    if (boqItem.children.length > 0) {
      for (let i = 0; i < boqItem.children.length; i++) {
        await this.recursiveUpdateAllChildLaborCostPercentageRecursively(
          boqId,
          boqItem.children[i],
          laborPercentageCost,
        );
      }
    }

    boqItem.laborPercentageCost = laborPercentageCost;
  }
  async recursiveUpdateAllChildProfitMarginRecursively(
    boqId: number,
    boqItem: BoqItemInterface,
    profitMargin: number,
  ): Promise<void> {
    if (boqItem.children.length > 0) {
      for (let i = 0; i < boqItem.children.length; i++) {
        await this.recursiveUpdateAllChildProfitMarginRecursively(
          boqId,
          boqItem.children[i],
          profitMargin,
        );
      }
    }

    boqItem.profitMarginPercentage = profitMargin;
    boqItem.profitMargin = boqItem.directCost * (profitMargin / 100);
  }
  async addItem(boqId: number, boqInsertData: BoqInsertData): Promise<void> {
    const roomId = 'boq-' + boqId;
    await this.joinRoom(boqId);

    // Get the room information
    const roomInformation: BoqRoomInterface = this.boqRooms.get(roomId);

    // Get parent profit margin percentage
    const itemInformation = this.findList(
      roomInformation.boqItems,
      (item) => item.id == boqInsertData.insertReferenceId,
    );
    const parentInformation = this.findList(
      roomInformation.boqItems,
      (item) => item.id == itemInformation.parentId,
    );
    const parentProfitMarginPercentage = parentInformation
      ? parentInformation.profitMarginPercentage
      : 10;
    const parentLaborPercentageCost = parentInformation
      ? parentInformation.laborPercentageCost
      : 30;

    // Check if the room is empty
    if (roomInformation) {
      const boqItem: BoqItemInterface = {
        id: roomInformation.boqInformation.lastKeyUsed + 1,
        isQuantityTakeOff: false,
        boqId: boqId,
        itemId: boqInsertData.insertValue.itemId,
        key: null,
        numerals: '',
        type: BoqType.HEADING,
        description: boqInsertData.insertValue.description,
        materialUnit: boqInsertData.insertValue.materialUnit,
        quantity: boqInsertData.insertValue.quantity,
        materialUnitCost: boqInsertData.insertValue.materialUnitCost,
        materialTotalCost: 0,
        laborUnitCost: boqInsertData.insertValue.laborUnitCost,
        laborTotalCost: 0,
        laborPercentageCost: parentLaborPercentageCost,
        laborUnitCostDisplay: boqInsertData.insertValue.laborUnitCost,
        directCost: 0,
        directCostWithProfit: 0,
        generation: 1,
        subTotal: 0,
        quantityPurchased: 0,
        parentId: null,
        children: [],
        order: 0,
        profitMarginPercentage: parentProfitMarginPercentage,
        profitMargin: 0,
        totalWithProfit: 0,
        approvalStatus: ApprovalStatus.NO_ITEM,
        subTotalWithProfit: 0,
        color: '#fff',
        isQuantityTakeOffItem:
          boqInsertData.insertValue.isQuantityTakeOffItem || false,
        quantityTakeOffTotal: 0,

        // with profit margin
        materialUnitCostWithProfit: 0,
        materialTotalCostWithProfit: 0,
        laborUnitCostWithProfit: 0,
        laborTotalCostWithProfit: 0,
      };

      await this.insertItemOnRoomInformation(
        roomId,
        boqInsertData.insertReferenceMethod,
        boqInsertData.insertReferenceId,
        boqItem,
      );
      await this.saveLastKeyUsedToDB(boqId, boqItem.id);
      await this.recursiveUpdateBoqItems(roomInformation.boqItems);

      this.utilityService.log(
        `${this.utilityService.accountInformation.username} has added an item to Room (${roomId})`,
      );
    }
  }
  async saveLastKeyUsedToDB(boqId: number, lastKeyUsed: number): Promise<void> {
    await this.prisma.billOfQuantity.update({
      where: { id: boqId },
      data: { lastKeyUsed: lastKeyUsed },
    });
  }
  async moveItem(boqId: number, boqMoveData: BoqMoveData): Promise<void> {
    const roomId = 'boq-' + boqId;
    await this.joinRoom(boqId);

    // Get the room information
    const roomInformation: BoqRoomInterface = this.boqRooms.get(roomId);

    // Check if the room is empty
    if (roomInformation) {
      const targetItem = this.findList(
        roomInformation.boqItems,
        (item) => item.id == boqMoveData.moveFromReferenceId,
      );
      // Store old item data for potential rollback (not currently used)
      const _oldItemData = JSON.parse(JSON.stringify(targetItem));

      if (targetItem) {
        const targetId = targetItem.id;

        // Remove the target item
        this.removeItemOnRoomInformation(roomId, targetId);

        // Insert the target item
        this.insertItemOnRoomInformation(
          roomId,
          boqMoveData.moveReferenceMethod,
          boqMoveData.moveToReferenceId,
          targetItem,
        );
        this.utilityService.log(
          `${this.utilityService.accountInformation.username} has moved an Item#${targetId} of Room (${roomId})`,
        );
      }
    }
  }

  async removeTargetItemFromDatabase(
    boqId: number,
    targetId: number,
  ): Promise<void> {
    await this.prisma.billOfQuantityTable.delete({
      where: { billOfQuantityId_id: { id: targetId, billOfQuantityId: boqId } },
    });
  }

  async insertItemOnRoomInformation(
    roomId,
    method: BoqInsertReferenceMethod,
    targetId: number,
    boqItem: BoqItemInterface,
  ) {
    const roomInformation: BoqRoomInterface = this.boqRooms.get(roomId);
    const isError = null;

    if (roomInformation) {
      switch (method) {
        // Insert the item inside the target item
        case BoqInsertReferenceMethod.INSIDE:
          const parentItem = this.findList(
            roomInformation.boqItems,
            (item) => item.id == targetId,
          );

          if (parentItem) {
            boqItem.generation = parentItem.generation + 1;
            boqItem.parentId = parentItem.id;
            parentItem.children.push(boqItem);
          }
          break;

        // Insert the item after the target item
        case BoqInsertReferenceMethod.AFTER:
          if (!targetId) {
            roomInformation.boqItems.push(boqItem);
          } else {
            const parentItem: BoqItemInterface = this.findFirstParent(
              roomInformation.boqItems,
              (item) => item.id == targetId,
            );

            if (!parentItem) {
              const index = roomInformation.boqItems.findIndex(
                (item) => item.id == targetId,
              );
              roomInformation.boqItems.splice(index + 1, 0, boqItem);
            } else {
              boqItem.generation = parentItem.generation + 1;
              boqItem.parentId = parentItem.id;
              const index = parentItem.children.findIndex(
                (item) => item.id == targetId,
              );
              parentItem.children.splice(index + 1, 0, boqItem);
            }
          }
          break;

        // Insert the item before the target item
        case BoqInsertReferenceMethod.BEFORE:
          if (!targetId) {
            roomInformation.boqItems.unshift(boqItem);
          } else {
            const parentItem: BoqItemInterface = this.findFirstParent(
              roomInformation.boqItems,
              (item) => item.id == targetId,
            );

            if (!parentItem) {
              const index = roomInformation.boqItems.findIndex(
                (item) => item.id == targetId,
              );
              roomInformation.boqItems.splice(index, 0, boqItem);
            } else {
              boqItem.generation = parentItem.generation + 1;
              boqItem.parentId = parentItem.id;
              const index = parentItem.children.findIndex(
                (item) => item.id == targetId,
              );
              parentItem.children.splice(index, 0, boqItem);
            }
          }
          break;

        // Insert the item as the first item
        case BoqInsertReferenceMethod.FIRST:
          if (!targetId) {
            roomInformation.boqItems.unshift(boqItem);
          } else {
            const parentItem = this.findFirstParent(
              roomInformation.boqItems,
              (item) => item.id == targetId,
            );

            if (parentItem) {
              boqItem.generation = parentItem.generation + 1;
              boqItem.parentId = parentItem.id;
              parentItem.children.unshift(boqItem);
            }
          }
          break;

        // Insert the item as the last item
        case BoqInsertReferenceMethod.LAST:
          if (!targetId) {
            roomInformation.boqItems.push(boqItem);
          } else {
            const parentItem = this.findFirstParent(
              roomInformation.boqItems,
              (item) => item.id == targetId,
            );

            if (parentItem) {
              boqItem.generation = parentItem.generation + 1;
              boqItem.parentId = parentItem.id;
              parentItem.children.push(boqItem);
            }
          }
          break;
      }

      roomInformation.boqInformation.lastKeyUsed = boqItem.id;
      this.boqRooms.set(roomId, roomInformation);

      // Update the room information
      await this.recursiveUpdateBoqItems(roomInformation.boqItems);
      await this.updateNumerals(roomId, roomInformation.boqItems);

      if (!isError) {
        const miniMap = await this.logItemMiniMap(
          roomId,
          roomInformation.boqItems,
        );
        const socketWait = [];
        socketWait.push(
          this.socketService.sendToRoom(roomId, 'BOQ_DATA', roomInformation),
        );
        socketWait.push(
          this.socketService.sendToRoom(roomId, 'BOQ_ITEM_MAP', miniMap),
        );

        await Promise.all(socketWait);
        await this.recursiveUpsertBoqItemToDatabase(
          roomInformation.boqInformation.id,
          roomInformation.boqItems,
        );
        socketWait.push(
          this.socketService.sendToRoom(roomId, 'BOQ_DATA', roomInformation),
        );
      } else {
        await this.socketService.sendToRoom(roomId, 'BOQ_ERROR', isError);
      }
    }
  }
  async recursiveUpdateBoqItems(boqItems: BoqItemInterface[]) {
    await this.recursiveUpdateBoqItem(boqItems, 1);
    await this.recursiveUpdateBoqItem(boqItems, 2);
    await this.recursiveUpdateBoqItem(boqItems, 3);
    await this.recursiveUpdateBoqItem(boqItems, 4);
    await this.recursiveUpdateBoqItem(boqItems, 5);
  }
  async recursiveUpdateBoqItem(
    boqItem: BoqItemInterface[],
    round: number,
  ): Promise<BoqItemInterface[]> {
    for (let i = 0; i < boqItem.length; i++) {
      if (boqItem[i].children.length > 0) {
        boqItem[i].children = await this.recursiveUpdateBoqItem(
          boqItem[i].children,
          round,
        );
      }

      // Set the order of the item
      boqItem[i].order = i + 1;

      this.determineType(boqItem[i]);

      // Compute the item based on Round
      if (round == 1) {
        this.computeBasedOnType(boqItem[i]);
      } else {
        this.computeSubTotal(boqItem[i]);
      }
    }

    return boqItem;
  }
  async recursiveUpsertBoqItemToDatabase(
    boqId: number,
    boqItem: BoqItemInterface[],
  ): Promise<BoqItemInterface[]> {
    for (let i = 0; i < boqItem.length; i++) {
      await this.saveItemToDB(boqId, boqItem[i]);

      if (boqItem[i].children.length > 0) {
        boqItem[i].children = await this.recursiveUpsertBoqItemToDatabase(
          boqId,
          boqItem[i].children,
        );
      }
    }

    return boqItem;
  }
  async saveItemToDB(boqId: number, boqItem: BoqItemInterface): Promise<void> {
    const checkExistItem = await this.prisma.billOfQuantityTable.findFirst({
      where: { id: boqItem.id, billOfQuantityId: boqId },
    });

    try {
      if (!checkExistItem) {
        const data = {
          id: boqItem.id,
          billOfQuantityId: boqId,
          type: boqItem.type,
          description: boqItem.description,
          quantity: boqItem.quantity,
          materialUnit: boqItem.materialUnit,
          materialUnitCost: boqItem.materialUnitCost,
          materialTotalCost: boqItem.materialTotalCost,
          laborUnitCost: boqItem.laborUnitCost,
          laborTotalCost: boqItem.laborTotalCost,
          laborPercentageCost: boqItem.laborPercentageCost,
          directCost: boqItem.directCost,
          subTotal: boqItem.subTotal,
          generation: boqItem.generation,
          order: boqItem.order,
          parentId: boqItem.parentId,
          numerals: boqItem.numerals,
          itemId: boqItem.itemId || null,
          color: boqItem.color || '#fff',
          profitMarginPercentage: boqItem.profitMarginPercentage,
          profitMargin: boqItem.profitMargin,
          totalWithProfit: boqItem.totalWithProfit,
          isQuantityTakeOffItem: boqItem.isQuantityTakeOffItem,
        };

        const response = await this.prisma.billOfQuantityTable.create({ data });
        boqItem.key = response.key;
      } else {
        await this.prisma.billOfQuantityTable.updateMany({
          where: { id: boqItem.id, billOfQuantityId: boqId },
          data: {
            type: boqItem.type,
            description: boqItem.description,
            quantity: boqItem.quantity,
            materialUnit: boqItem.materialUnit,
            materialUnitCost: boqItem.materialUnitCost,
            materialTotalCost: boqItem.materialTotalCost,
            laborUnitCost: boqItem.laborUnitCost,
            laborTotalCost: boqItem.laborTotalCost,
            laborPercentageCost: boqItem.laborPercentageCost,
            directCost: boqItem.directCost,
            subTotal: boqItem.subTotal,
            generation: boqItem.generation,
            order: boqItem.order,
            parentId: boqItem.parentId,
            itemId: boqItem.itemId || null,
            color: boqItem.color || '#fff',
            profitMarginPercentage: boqItem.profitMarginPercentage,
            profitMargin: boqItem.profitMargin,
            totalWithProfit: boqItem.totalWithProfit,
            isQuantityTakeOffItem: boqItem.isQuantityTakeOffItem,
          },
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  private async removeItemOnRoomInformation(roomId: string, targetId: number) {
    const roomInformation: BoqRoomInterface = this.boqRooms.get(roomId);

    if (roomInformation) {
      const parentItem = this.findFirstParent(
        roomInformation.boqItems,
        (item) => item.id == targetId,
      );

      if (parentItem) {
        const index = parentItem.children.findIndex(
          (item) => item.id == targetId,
        );
        parentItem.children.splice(index, 1);
      } else {
        const index = roomInformation.boqItems.findIndex(
          (item) => item.id == targetId,
        );
        roomInformation.boqItems.splice(index, 1);
      }
    }
  }

  private async computeSubTotal(
    boqItem: BoqItemInterface,
  ): Promise<BoqItemInterface> {
    const roomInformation: BoqRoomInterface = this.boqRooms.get(
      'boq-' + boqItem.boqId,
    );

    if (boqItem.children.length) {
      if (boqItem.type == BoqType.HEADING) {
        boqItem.subTotal = boqItem.children.reduce(
          (acc, item) => acc + item.subTotal,
          0,
        );
        boqItem.subTotalWithProfit = boqItem.children.reduce(
          (acc, item) => acc + item.subTotalWithProfit,
          0,
        );

        // console.log('Sub Total: Heading', boqItem.subTotalWithProfit);

        if (!boqItem.subTotalWithProfit || isNaN(boqItem.subTotalWithProfit)) {
          boqItem.subTotalWithProfit = 0;
        }
      } else if (boqItem.type == BoqType.SUBHEADING) {
        boqItem.subTotal = boqItem.children.reduce(
          (acc, item) => acc + item.directCost,
          0,
        );
        boqItem.subTotalWithProfit = boqItem.children.reduce(
          (acc, item) => acc + item.directCostWithProfit,
          0,
        );

        // console.log('Sub Total: Sub Heading', boqItem.subTotalWithProfit);

        if (!boqItem.subTotalWithProfit || isNaN(boqItem.subTotalWithProfit)) {
          boqItem.subTotalWithProfit = 0;
        }
      } else {
        if (boqItem.children.length) {
          // Clear only if the room is not locked
          if (
            roomInformation &&
            roomInformation.boqInformation.status != 'LOCKED'
          ) {
            boqItem.quantity = null;
            boqItem.materialUnitCost = null;
            boqItem.materialTotalCost = null;
            boqItem.laborUnitCost = null;
            boqItem.laborUnitCostDisplay = null;
            boqItem.laborTotalCost = null;
          }

          // Computation for Quantity Take Off Items
          if (!boqItem.isQuantityTakeOff) {
            boqItem.directCost = boqItem.children.reduce(
              (acc, item) => acc + item.directCost,
              0,
            );
            boqItem.directCostWithProfit = boqItem.children.reduce(
              (acc, item) => acc + item.directCostWithProfit,
              0,
            );

            // console.log('Direct Cost: Sub Heading', boqItem.directCost);
            // console.log('Direct Cost with Profit: Sub Heading', boqItem.directCostWithProfit);

            if (
              !boqItem.directCostWithProfit ||
              isNaN(boqItem.directCostWithProfit)
            ) {
              boqItem.directCostWithProfit = 0;
            }
          }

          boqItem.quantityTakeOffTotal = boqItem.children.reduce(
            (acc, item) => acc + item.materialTotalCost,
            0,
          );
        }
      }
    }

    if (roomInformation && roomInformation.boqInformation.status != 'LOCKED') {
      if (boqItem.children.length > 0) {
        // compute profit margin based on children
        boqItem.profitMargin = boqItem.children.reduce(
          (acc, item) => acc + item.profitMargin,
          0,
        );
        boqItem.profitMarginPercentage =
          (boqItem.profitMargin / boqItem.directCost) * 100;
        boqItem.profitMarginPercentage =
          Math.round(boqItem.profitMarginPercentage * 100) / 100;
      } else {
        boqItem.profitMargin =
          boqItem.directCost * (boqItem.profitMarginPercentage / 100);
      }
    }

    boqItem.totalWithProfit = boqItem.directCost + boqItem.profitMargin;
    return boqItem;
  }

  private async determineType(
    boqItem: BoqItemInterface,
  ): Promise<BoqItemInterface> {
    if (boqItem.generation == 1) {
      boqItem.type = BoqType.HEADING;
    } else if (boqItem.generation == 2) {
      boqItem.type = BoqType.SUBHEADING;
    } else {
      boqItem.type = BoqType.ITEM;
    }

    return boqItem;
  }

  private async updateNumerals(
    roomId: string,
    boqItems: BoqItemInterface[],
  ): Promise<void> {
    const room = this.boqRooms.get(roomId);
    room.boqTotal = 0;
    room.boqTotalWithProfit = 0;

    for (let i = 0; i < boqItems.length; i++) {
      boqItems[i] = await this.computeNumerals(roomId, boqItems[i]);
      if (boqItems[i].children.length > 0) {
        await this.updateNumerals(roomId, boqItems[i].children);
      }
    }

    room.boqTotal += boqItems.reduce(
      (acc, item) => acc + (item.type == 'HEADING' ? item.subTotal : 0),
      0,
    );
    let boqTotalLine = boqItems.reduce(
      (acc, item) =>
        acc + (item.type == 'HEADING' ? item.subTotalWithProfit : 0),
      0,
    );

    // console.log('Boq Total Line', boqTotalLine);

    if (!boqTotalLine || isNaN(boqTotalLine)) {
      boqTotalLine = 0;
    }

    room.boqTotalWithProfit += boqTotalLine;
  }

  private async computeNumerals(
    roomId: string,
    boqItem: BoqItemInterface,
  ): Promise<BoqItemInterface> {
    if (boqItem.generation == 1) {
      // numerals should be I, II, III, IV, V, VI, VII, VIII, IX, X
      boqItem.numerals = this.utilityService.convertToRoman(boqItem.order);
    } else if (boqItem.generation == 2) {
      // numerals should be A, B, C, D, E, F, G, H, I, J
      boqItem.numerals = String.fromCharCode(65 + boqItem.order - 1);
    } else if (boqItem.generation == 3) {
      // numerals should be 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0
      boqItem.numerals = boqItem.order.toString() + '.0';
    } else {
      const parents = this.getArrayOfParents(roomId, boqItem.id).reverse();
      let numerals = '';

      for (let i = 0; i < parents.length; i++) {
        if (parents[i].generation > 2) {
          numerals += parents[i].order.toString() + '.';
        }
      }

      numerals += boqItem.order.toString();
      boqItem.numerals = numerals;
    }

    return boqItem;
  }
  private async computeBasedOnType(
    boqItem: BoqItemInterface,
  ): Promise<BoqItemInterface> {
    switch (boqItem.type) {
      case BoqType.HEADING:
        this.computedBasedonTypeHeading(boqItem);
        break;
      case BoqType.SUBHEADING:
        this.computedBasedonTypeSubHeading(boqItem);
        break;
      case BoqType.ITEM:
        this.computedBasedonTypeItem(boqItem);
        break;
    }

    return boqItem;
  }

  private async computedBasedonTypeHeading(
    boqItem: BoqItemInterface,
  ): Promise<BoqItemInterface> {
    boqItem.quantity = null;
    boqItem.materialUnitCost = null;
    boqItem.materialTotalCost = null;
    boqItem.materialTotalCostWithProfit = null;
    boqItem.laborUnitCost = null;
    boqItem.laborTotalCost = null;
    boqItem.laborTotalCostWithProfit = null;
    boqItem.directCost = null;
    boqItem.directCostWithProfit = null;
    boqItem.subTotal = 0;
    return boqItem;
  }

  private async computedBasedonTypeSubHeading(
    boqItem: BoqItemInterface,
  ): Promise<BoqItemInterface> {
    boqItem.quantity = null;
    boqItem.materialUnitCost = null;
    boqItem.materialTotalCost = null;
    boqItem.materialTotalCostWithProfit = null;
    boqItem.laborUnitCost = null;
    boqItem.laborTotalCost = null;
    boqItem.laborTotalCostWithProfit = null;
    boqItem.directCost = null;
    boqItem.directCostWithProfit = null;
    boqItem.subTotal = 0;
    return boqItem;
  }

  private async computedBasedonTypeItem(
    boqItem: BoqItemInterface,
  ): Promise<BoqItemInterface> {
    boqItem.materialUnitCost = boqItem.materialUnitCost || 0;
    boqItem.quantity = boqItem.quantity || 0;
    boqItem.materialTotalCost = boqItem.materialUnitCost * boqItem.quantity;
    boqItem.laborUnitCost = boqItem.laborUnitCost || 0;
    boqItem.laborUnitCostDisplay =
      boqItem.laborUnitCost ||
      boqItem.materialUnitCost * (boqItem.laborPercentageCost / 100);

    // Compute the labor unit cost if it is not set
    boqItem.laborTotalCost = boqItem.laborUnitCostDisplay * boqItem.quantity;
    boqItem.subTotal = null;
    boqItem.subTotalWithProfit = null;
    boqItem.directCost = boqItem.materialTotalCost + boqItem.laborTotalCost;

    boqItem.materialUnitCostWithProfit =
      boqItem.materialUnitCost +
      boqItem.materialUnitCost * (boqItem.profitMarginPercentage / 100);
    boqItem.materialTotalCostWithProfit =
      boqItem.materialUnitCostWithProfit * (boqItem.quantity || 0);
    boqItem.laborUnitCostWithProfit =
      boqItem.laborUnitCostDisplay +
      boqItem.laborUnitCostDisplay * (boqItem.profitMarginPercentage / 100);
    boqItem.laborTotalCostWithProfit =
      boqItem.laborUnitCostWithProfit * (boqItem.quantity || 0);
    boqItem.directCostWithProfit =
      boqItem.materialTotalCostWithProfit + boqItem.laborTotalCostWithProfit;

    if (!boqItem.directCostWithProfit || isNaN(boqItem.directCostWithProfit)) {
      boqItem.directCostWithProfit = 0;
    }

    return boqItem;
  }

  private async logItemMiniMap(
    roomId: string,
    boqItems: BoqItemInterface[],
  ): Promise<any> {
    const miniMap = [];
    for (let i = 0; i < boqItems.length; i++) {
      miniMap.push({
        id: boqItems[i].id,
        key: boqItems[i].key,
        type: boqItems[i].type,
        generation: boqItems[i].generation,
        numerals: boqItems[i].numerals,
        order: boqItems[i].order,
        children:
          boqItems[i].children.length > 0
            ? await this.logItemMiniMap(roomId, boqItems[i].children)
            : [],
      });
    }

    return miniMap;
  }
  private async getBoqItemsFromDatabase(
    boqId: number,
    parentId: number = null,
  ): Promise<BoqItemInterface[]> {
    const boqItems = await this.prisma.billOfQuantityTable.findMany({
      where: { billOfQuantityId: boqId, parentId: parentId },
      orderBy: { order: 'asc' },
    });

    // Get the children of the parent
    const response: BoqItemInterface[] = await Promise.all(
      boqItems.map(async (item) => {
        return {
          id: item.id,
          isQuantityTakeOff: item.isQuantityTakeOff,
          boqId: item.billOfQuantityId,
          key: item.key,
          numerals: item.numerals,
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          quantityPurchased: item.quantityPurchased,
          materialUnit: item.materialUnit,
          materialUnitCost: item.materialUnitCost,
          materialTotalCost: item.materialTotalCost,
          laborPercentageCost: item.laborPercentageCost,
          laborUnitCost: item.laborUnitCost,
          laborUnitCostDisplay: item.laborUnitCost,
          laborTotalCost: item.laborTotalCost,
          directCost: item.directCost,
          directCostWithProfit: item.directCostWithProfit,
          subTotal: item.subTotal,
          subTotalWithProfit: item.subTotalWithProfit,
          generation: item.generation,
          order: item.order,
          parentId: item.parentId,
          children: [],
          itemId: item.itemId || null,
          approvalStatus: item.approvalStatus,
          color: item.color,
          profitMarginPercentage: item.profitMarginPercentage,
          profitMargin: item.profitMargin,
          totalWithProfit: item.totalWithProfit,
          isQuantityTakeOffItem: item.isQuantityTakeOffItem,
          quantityTakeOffTotal: item.quantityTakeOffTotal,

          // with profit margin
          materialUnitCostWithProfit: 0,
          materialTotalCostWithProfit: 0,
          laborUnitCostWithProfit: 0,
          laborTotalCostWithProfit: 0,
        };
      }),
    );

    // Get the children of the parent
    await Promise.all(
      response.map(async (item) => {
        item.children = await this.getBoqItemsFromDatabase(boqId, item.id);
      }),
    );

    return response;
  }
  private async getRoomInformation(boqId: number): Promise<BoqRoomInterface> {
    const boqInformation = await this.prisma.billOfQuantity.findUnique({
      where: { id: boqId },
      include: { Project: true },
    });
    const responseBoqInformation =
      this.formatBillOfQuantityResponse(boqInformation);
    const boqItems = await this.getBoqItemsFromDatabase(boqId);

    // Update the boqItems
    await this.recursiveUpdateBoqItems(boqItems);

    this.utilityService.log(
      `Room information retrieved from database (${boqId} - ${responseBoqInformation['status']})`,
    );

    return {
      boqInformation: {
        id: responseBoqInformation['id'],
        contractId: responseBoqInformation['contractId'],
        revision: responseBoqInformation['revision'],
        subject: responseBoqInformation['subject'],
        totalMaterialCost: responseBoqInformation['totalMaterialCost'],
        contractLocation: responseBoqInformation['contractLocation'],
        totalLaborCost: responseBoqInformation['totalLaborCost'],
        totalDirectCost: responseBoqInformation['totalDirectCost'],
        expirationDate: responseBoqInformation['expirationDate'],
        isDeleted: responseBoqInformation['isDeleted'],
        isDraft: responseBoqInformation['isDraft'],
        totalCost: responseBoqInformation['totalCost'],
        updatedAt: responseBoqInformation['updatedAt'],
        createdAt: responseBoqInformation['createdAt'],
        lastKeyUsed: responseBoqInformation['lastKeyUsed'] || 0,
        status: responseBoqInformation['status'],
      },
      boqItems: boqItems,
      boqTotal: 0,
      boqTotalWithProfit: 0,
    };
  }

  private findList(list: any[], condition: (item: any) => boolean): any {
    for (let i = 0; i < list.length; i++) {
      if (condition(list[i])) {
        return list[i];
      }
      if (list[i].children && list[i].children.length > 0) {
        const childItem = this.findList(list[i].children, condition);
        if (childItem) {
          return childItem;
        }
      }
    }
    return null;
  }
  private getArrayOfParents(
    roomId: string,
    itemId: number,
  ): BoqItemInterface[] {
    let parents = [];

    const roomInformation: BoqRoomInterface = this.boqRooms.get(roomId);

    if (roomInformation) {
      const parentItem = this.findFirstParent(
        roomInformation.boqItems,
        (item) => item.id == itemId,
      );

      if (parentItem) {
        parents.push(parentItem);
        parents = parents.concat(this.getArrayOfParents(roomId, parentItem.id));
      }
    }

    return parents;
  }
  private findFirstParent(
    list: any[],
    condition: (item: any) => boolean,
    parent: any = null,
  ): any {
    for (let i = 0; i < list.length; i++) {
      if (condition(list[i])) {
        return parent;
      }
      if (list[i].children && list[i].children.length > 0) {
        const childItem = this.findFirstParent(
          list[i].children,
          condition,
          list[i],
        );
        if (childItem) {
          return childItem;
        }
      }
    }
    return null;
  }

  /**
   * Formats a bill of quantity response according to the standard format
   */
  private formatBillOfQuantityResponse(boq: any): any {
    if (!boq) return null;

    return {
      id: boq.id,
      contractId: boq.contractId,
      revision: boq.revision,
      subject: boq.subject,
      contractLocation: boq.contractLocation,
      expirationDate: this.utilityService.formatDate(boq.expirationDate),
      totalMaterialCost: boq.totalMaterialCost,
      totalLaborCost: boq.totalLaborCost,
      totalDirectCost: boq.totalDirectCost,
      totalCost: boq.totalCost,
      createdAt: this.utilityService.formatDate(boq.createdAt),
      updatedAt: this.utilityService.formatDate(boq.updatedAt),
      isDeleted: boq.isDeleted,
      isDraft: boq.isDraft,
      projectId: boq.projectId,
      createdByAccount: boq.createdByAccount
        ? this.formatAccountResponse(boq.createdByAccount)
        : null,
      updatedByAccount: boq.updatedByAccount
        ? this.formatAccountResponse(boq.updatedByAccount)
        : null,
      sourceBillOfQuantity: boq.sourceBillOfQuantity
        ? this.formatBillOfQuantityResponse(boq.sourceBillOfQuantity)
        : null,
      lastKeyUsed: boq.lastKeyUsed,
      status: boq.status,
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
