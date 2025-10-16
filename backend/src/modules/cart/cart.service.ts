import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  AddItemToCartRequest,
  AddItemGroupToCartRequest,
  UpdateCartItemRequest,
  UpdateCartRequest,
  CheckoutCartRequest,
} from '@shared/request/cart.request';
import {
  CartResponse,
  CartItemResponse,
  CartSummaryResponse,
  CheckoutResponse,
} from '@shared/response/cart.response';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create cart for cashier
   */
  async getCart(accountId: string): Promise<CartResponse> {
    // Verify account is a cashier
    const cashier = await this.prisma.cashierData.findUnique({
      where: { accountId },
      include: {
        account: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!cashier) {
      throw new UnauthorizedException('Account is not a cashier');
    }

    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { cashierId: accountId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      // Create empty cart
      cart = await this.prisma.cart.create({
        data: {
          cashierId: accountId,
        },
        include: {
          items: true,
        },
      });
    }

    return cart as CartResponse;
  }

  /**
   * Add individual item to cart
   */
  async addItem(
    accountId: string,
    data: AddItemToCartRequest,
  ): Promise<{ cartItem: CartItemResponse; cart: CartSummaryResponse }> {
    // Get item details
    const item = await this.prisma.item.findUnique({
      where: { id: data.itemId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.itemType === 'ITEM_GROUP') {
      throw new BadRequestException(
        'Use /cart/items/group endpoint for ITEM_GROUP items',
      );
    }

    // Get or create cart
    const cart = await this.getCart(accountId);

    // Calculate pricing
    const unitPrice = item.sellingPrice;
    const subtotal = unitPrice * data.quantity;
    let discountAmount = 0;

    if (data.discountType === 'percentage' && data.discountPercentage) {
      if (data.discountPercentage < 0 || data.discountPercentage > 100) {
        throw new BadRequestException(
          'Discount percentage must be between 0 and 100',
        );
      }
      discountAmount = (subtotal * data.discountPercentage) / 100;
    } else if (data.discountType === 'fixed' && data.discountAmount) {
      if (data.discountAmount < 0) {
        throw new BadRequestException('Discount amount cannot be negative');
      }
      discountAmount = data.discountAmount;
    }

    const totalAfterDiscount = subtotal - discountAmount;

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        itemId: data.itemId,
        parentCartItemId: null, // Only top-level items
      },
    });

    let cartItem: CartItemResponse;

    if (existingItem) {
      // Update existing item
      cartItem = (await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: data.quantity,
          subtotal,
          discountType: data.discountType,
          discountPercentage: data.discountPercentage,
          discountAmount,
          totalAfterDiscount,
        },
      })) as CartItemResponse;
    } else {
      // Create new cart item
      cartItem = (await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          itemId: data.itemId,
          itemName: item.name,
          itemImage: null, // Item model doesn't have imageUrl field
          itemType: item.itemType,
          quantity: data.quantity,
          unitPrice,
          subtotal,
          discountType: data.discountType,
          discountPercentage: data.discountPercentage,
          discountAmount,
          totalAfterDiscount,
        },
      })) as CartItemResponse;
    }

    // Recalculate cart totals
    const updatedCart = await this.recalculateCartTotals(cart.id);

    return {
      cartItem,
      cart: {
        subtotal: updatedCart.subtotal,
        discountAmount: updatedCart.discountAmount,
        total: updatedCart.total,
      },
    };
  }

  /**
   * Add item group (combo) to cart
   */
  async addItemGroup(
    accountId: string,
    data: AddItemGroupToCartRequest,
  ): Promise<{
    parentItem: CartItemResponse;
    childItems: CartItemResponse[];
  }> {
    // Get group item details
    const groupItem = await this.prisma.item.findUnique({
      where: { id: data.groupItemId },
    });

    if (!groupItem) {
      throw new NotFoundException('Group item not found');
    }

    if (groupItem.itemType !== 'ITEM_GROUP') {
      throw new BadRequestException('Item is not an ITEM_GROUP');
    }

    // Get or create cart
    const cart = await this.getCart(accountId);

    // Validate child items exist
    const childItemIds = data.childItems.map((ci) => ci.itemId);
    const items = await this.prisma.item.findMany({
      where: { id: { in: childItemIds } },
    });

    if (items.length !== childItemIds.length) {
      throw new NotFoundException('One or more child items not found');
    }

    // Create parent cart item
    const parentPrice = groupItem.sellingPrice;
    const parentSubtotal = parentPrice * data.quantity;

    const parentCartItem = (await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        itemId: data.groupItemId,
        itemName: groupItem.name,
        itemImage: null, // Item model doesn't have imageUrl field
        itemType: 'ITEM_GROUP',
        quantity: data.quantity,
        unitPrice: parentPrice,
        subtotal: parentSubtotal,
        totalAfterDiscount: parentSubtotal,
      },
    })) as CartItemResponse;

    // Create child cart items
    const childCartItems: CartItemResponse[] = [];

    for (const childData of data.childItems) {
      const childItem = items.find((i) => i.id === childData.itemId);
      if (!childItem) continue;

      // Child items have no price - only the parent bundle has a price
      const childCartItem = (await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          parentCartItemId: parentCartItem.id,
          itemId: childData.itemId,
          itemName: childItem.name,
          itemImage: null, // Item model doesn't have imageUrl field
          itemType: childItem.itemType,
          quantity: childData.quantity,
          unitPrice: 0,
          subtotal: 0,
          totalAfterDiscount: 0,
          isIncluded: childData.isIncluded,
        },
      })) as CartItemResponse;

      childCartItems.push(childCartItem);
    }

    // Recalculate cart totals
    await this.recalculateCartTotals(cart.id);

    return {
      parentItem: parentCartItem,
      childItems: childCartItems,
    };
  }

  /**
   * Update cart item
   */
  async updateItem(
    accountId: string,
    itemId: string,
    data: UpdateCartItemRequest,
  ): Promise<{ cartItem: CartItemResponse; cart: CartSummaryResponse }> {
    // Get cart
    const cart = await this.getCart(accountId);

    // Find cart item
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Prepare update data
    const updateData: any = {};

    if (data.quantity !== undefined) {
      if (data.quantity < 1) {
        throw new BadRequestException('Quantity must be at least 1');
      }
      updateData.quantity = data.quantity;
      updateData.subtotal = cartItem.unitPrice * data.quantity;
    }

    if (data.discountPercentage !== undefined) {
      if (data.discountPercentage < 0 || data.discountPercentage > 100) {
        throw new BadRequestException(
          'Discount percentage must be between 0 and 100',
        );
      }
      const subtotal = updateData.subtotal || cartItem.subtotal;
      updateData.discountPercentage = data.discountPercentage;
      updateData.discountAmount = (subtotal * data.discountPercentage) / 100;
      updateData.totalAfterDiscount = subtotal - updateData.discountAmount;
    }

    if (data.discountAmount !== undefined) {
      if (data.discountAmount < 0) {
        throw new BadRequestException('Discount amount cannot be negative');
      }
      const subtotal = updateData.subtotal || cartItem.subtotal;
      updateData.discountAmount = data.discountAmount;
      updateData.totalAfterDiscount = subtotal - data.discountAmount;
    }

    if (data.isIncluded !== undefined) {
      updateData.isIncluded = data.isIncluded;
    }

    // Update cart item
    const updatedItem = (await this.prisma.cartItem.update({
      where: { id: itemId },
      data: updateData,
    })) as CartItemResponse;

    // Recalculate cart totals
    const updatedCart = await this.recalculateCartTotals(cart.id);

    return {
      cartItem: updatedItem,
      cart: {
        subtotal: updatedCart.subtotal,
        discountAmount: updatedCart.discountAmount,
        total: updatedCart.total,
      },
    };
  }

  /**
   * Remove item from cart
   */
  async removeItem(
    accountId: string,
    itemId: string,
  ): Promise<{ removedItemId: string; cart: CartSummaryResponse }> {
    // Get cart
    const cart = await this.getCart(accountId);

    // Find cart item
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Delete item (CASCADE will delete children if ITEM_GROUP)
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    // Recalculate cart totals
    const updatedCart = await this.recalculateCartTotals(cart.id);

    // Count remaining items
    const itemsRemaining = await this.prisma.cartItem.count({
      where: { cartId: cart.id },
    });

    return {
      removedItemId: itemId,
      cart: {
        subtotal: updatedCart.subtotal,
        discountAmount: updatedCart.discountAmount,
        total: updatedCart.total,
      },
    };
  }

  /**
   * Clear cart
   */
  async clearCart(accountId: string): Promise<{ itemsRemoved: number }> {
    // Get cart
    const cart = await this.getCart(accountId);

    // Count items
    const itemCount = await this.prisma.cartItem.count({
      where: { cartId: cart.id },
    });

    // Delete all items
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Reset cart totals
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        subtotal: 0,
        discountAmount: 0,
        total: 0,
      },
    });

    return { itemsRemoved: itemCount };
  }

  /**
   * Update cart customer info
   */
  async updateCart(
    accountId: string,
    data: UpdateCartRequest,
  ): Promise<CartResponse> {
    // Get cart
    const cart = await this.getCart(accountId);

    // Validate customer if provided
    if (data.customerId) {
      const customer = await this.prisma.account.findUnique({
        where: { id: data.customerId },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    // Update cart
    const updatedCart = await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        remarks: data.remarks,
      },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return updatedCart as CartResponse;
  }

  /**
   * Checkout - Convert cart to sale
   */
  async checkout(
    accountId: string,
    branchId: number | null,
    data: CheckoutCartRequest,
  ): Promise<CheckoutResponse> {
    // Get cart with items
    const cart = await this.prisma.cart.findUnique({
      where: { cashierId: accountId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
        cashier: {
          include: {
            account: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new BadRequestException('Cart not found');
    }

    if (cart.items.length === 0) {
      throw new BadRequestException(
        'Cannot checkout with an empty cart. Please add items first.',
      );
    }

    // Validate payments
    const totalPaymentAmount = data.payments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    if (Math.abs(totalPaymentAmount - data.paymentAmount) > 0.01) {
      throw new BadRequestException(
        'Sum of payment amounts must equal paymentAmount',
      );
    }

    if (data.paymentAmount < cart.total) {
      throw new BadRequestException(
        'Payment amount is less than cart total. Insufficient payment.',
      );
    }

    // Calculate change
    const changeAmount = data.changeAmount ?? data.paymentAmount - cart.total;

    if (data.paymentAmount > cart.total && changeAmount <= 0) {
      throw new BadRequestException(
        'Payment amount exceeds total. changeAmount is required.',
      );
    }

    // Validate inventory if branch has warehouse
    let warehouseId: string | null = null;
    const inventoryDeductions: Map<string, number> = new Map();

    if (branchId) {
      const branchData = await this.prisma.project.findUnique({
        where: { id: branchId },
        select: { mainWarehouseId: true },
      });

      if (branchData?.mainWarehouseId) {
        warehouseId = branchData.mainWarehouseId;

        // Collect all items that need inventory check (exclude parent ITEM_GROUP)
        const itemsToCheck: Array<{ itemId: string; quantity: number; name: string }> = [];

        for (const cartItem of cart.items) {
          // Skip parent ITEM_GROUP items (they don't have inventory)
          if (cartItem.itemType === 'ITEM_GROUP' && !cartItem.parentCartItemId) {
            continue;
          }

          // Include individual products and child items of groups (if isIncluded)
          if (cartItem.itemId && (cartItem.parentCartItemId ? cartItem.isIncluded : true)) {
            itemsToCheck.push({
              itemId: cartItem.itemId,
              quantity: cartItem.quantity,
              name: cartItem.itemName,
            });
          }
        }

        // Aggregate quantities if same item appears multiple times
        // Also keep track of item names
        const itemNames: Map<string, string> = new Map();
        for (const item of itemsToCheck) {
          const currentQty = inventoryDeductions.get(item.itemId) || 0;
          inventoryDeductions.set(item.itemId, currentQty + item.quantity);
          itemNames.set(item.itemId, item.name); // Store item name
        }

        // Check inventory for each unique item
        const insufficientItems: Array<{ name: string; needed: number; available: number }> = [];

        for (const [itemId, neededQty] of inventoryDeductions.entries()) {
          const inventoryRecord = await this.prisma.inventoryItem.findUnique({
            where: {
              warehouseId_itemId: {
                warehouseId,
                itemId,
              },
            },
          });

          const availableQty = inventoryRecord?.stockCount || 0;

          if (availableQty < neededQty) {
            insufficientItems.push({
              name: itemNames.get(itemId) || 'Unknown Item',
              needed: neededQty,
              available: availableQty,
            });
          }
        }

        // If any items have insufficient stock, throw error
        if (insufficientItems.length > 0) {
          const itemDetails = insufficientItems
            .map((item) => `${item.name} (needed: ${item.needed}, available: ${item.available})`)
            .join(', ');

          throw new BadRequestException(
            `Insufficient inventory for the following items: ${itemDetails}`,
          );
        }
      }
    }

    // Get laborer if provided
    let laborerName: string | undefined;
    if (data.laborerId) {
      const laborer = await this.prisma.account.findUnique({
        where: { id: data.laborerId },
        select: {
          firstName: true,
          lastName: true,
        },
      });

      if (laborer) {
        laborerName = `${laborer.firstName} ${laborer.lastName}`;
      }
    }

    // Get customer name
    let customerName: string | undefined = cart.customerName;
    if (cart.customerId) {
      const customer = await this.prisma.account.findUnique({
        where: { id: cart.customerId },
        select: {
          firstName: true,
          lastName: true,
        },
      });

      if (customer) {
        customerName = `${customer.firstName} ${customer.lastName}`;
      }
    }

    // Get cashier info
    const cashierName = `${cart.cashier.account.firstName} ${cart.cashier.account.lastName}`;

    // Get branch name (Branch is Project model)
    const branch = await this.prisma.project.findUnique({
      where: { id: branchId },
      select: { name: true },
    });

    // Generate sale number
    const lastSale = await this.prisma.sale.findFirst({
      orderBy: { saleNumber: 'desc' },
      select: { saleNumber: true },
    });

    let saleNumber = '00000001';
    if (lastSale?.saleNumber) {
      const lastNumber = parseInt(lastSale.saleNumber, 10);
      saleNumber = String(lastNumber + 1).padStart(8, '0');
    }

    // Create sale in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create sale
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          subtotal: cart.subtotal,
          discountAmount: cart.discountAmount,
          total: cart.total,
          paymentAmount: data.paymentAmount,
          changeAmount,
          cashierId: accountId,
          laborerId: data.laborerId,
          customerId: cart.customerId,
          branchId,
          status: 'PROCESSED',
          cashierName,
          laborerName,
          customerName,
          branchName: branch?.name,
          remarks: cart.remarks,
        },
      });

      // Create sale items - must create parent items first, then child items
      const saleItems: any[] = [];
      const cartToSaleItemMap = new Map<string, string>(); // Map cart item ID to sale item ID

      // First, create all parent items (items without parentCartItemId)
      const parentItems = cart.items.filter((item) => !item.parentCartItemId);
      for (const item of parentItems) {
        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            itemId: item.itemId,
            parentSaleItemId: null,
            itemName: item.itemName,
            itemImage: item.itemImage,
            itemType: item.itemType,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            discountType: item.discountType,
            discountPercentage: item.discountPercentage,
            discountAmount: item.discountAmount,
            totalAfterDiscount: item.totalAfterDiscount,
            isIncluded: item.isIncluded,
          },
        });
        saleItems.push(saleItem);
        cartToSaleItemMap.set(item.id, saleItem.id);
      }

      // Then, create all child items (items with parentCartItemId)
      const childItems = cart.items.filter((item) => item.parentCartItemId);
      for (const item of childItems) {
        const parentSaleItemId = cartToSaleItemMap.get(item.parentCartItemId);
        if (!parentSaleItemId) {
          throw new BadRequestException(
            `Parent sale item not found for child item ${item.itemName}`,
          );
        }

        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            itemId: item.itemId,
            parentSaleItemId,
            itemName: item.itemName,
            itemImage: item.itemImage,
            itemType: item.itemType,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            discountType: item.discountType,
            discountPercentage: item.discountPercentage,
            discountAmount: item.discountAmount,
            totalAfterDiscount: item.totalAfterDiscount,
            isIncluded: item.isIncluded,
          },
        });
        saleItems.push(saleItem);
      }

      // Create sale payments
      const salePayments = await Promise.all(
        data.payments.map((payment) =>
          tx.salePayment.create({
            data: {
              saleId: sale.id,
              paymentMethod: payment.paymentMethod,
              amount: payment.amount,
              referenceNumber: payment.referenceNumber,
            },
          }),
        ),
      );

      // Deduct inventory if warehouse exists
      if (warehouseId && inventoryDeductions.size > 0) {
        for (const [itemId, quantity] of inventoryDeductions.entries()) {
          // Get current inventory
          const inventoryRecord = await tx.inventoryItem.findUnique({
            where: {
              warehouseId_itemId: {
                warehouseId,
                itemId,
              },
            },
          });

          if (inventoryRecord) {
            // Deduct inventory
            await tx.inventoryItem.update({
              where: {
                warehouseId_itemId: {
                  warehouseId,
                  itemId,
                },
              },
              data: {
                stockCount: {
                  decrement: quantity,
                },
              },
            });
          }
        }
      }

      // Clear cart items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Reset cart totals
      await tx.cart.update({
        where: { id: cart.id },
        data: {
          subtotal: 0,
          discountAmount: 0,
          total: 0,
          customerId: null,
          customerName: null,
          customerEmail: null,
          remarks: null,
        },
      });

      return { sale, saleItems, salePayments };
    });

    return {
      sale: result.sale as any,
      saleItems: result.saleItems as any,
      payments: result.salePayments as any,
      cartCleared: true,
    };
  }

  /**
   * Recalculate cart totals
   */
  private async recalculateCartTotals(cartId: string) {
    // Get all top-level items (parent items only)
    const items = await this.prisma.cartItem.findMany({
      where: {
        cartId,
        parentCartItemId: null,
      },
    });

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = items.reduce(
      (sum, item) => sum + item.discountAmount,
      0,
    );
    const total = items.reduce(
      (sum, item) => sum + item.totalAfterDiscount,
      0,
    );

    return await this.prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotal,
        discountAmount,
        total,
      },
    });
  }
}
