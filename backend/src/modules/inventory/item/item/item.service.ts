import { ConflictException, Inject, NotFoundException } from '@nestjs/common';
import {
  CreateSimpleItemDto,
  UpdateSimpleItemDto,
} from '../../../../dto/simple-item.validator.dto';
import {
  CreateItemWithVariantsDto,
  CreateVariantDto,
  GetVariationItemDTO,
  UpdateItemWithVariantsDto,
} from '../../../../dto/variation-item.create.dto';
import { PrismaService } from '@common/prisma.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UtilityService } from '@common/utility.service';
import { Prisma, Item } from '@prisma/client';
import UnitOfMeasurementReference from '../../../../reference/uom-list.reference';

export class ItemService {
  @Inject() public prisma: PrismaService;
  @Inject() public utility: UtilityService;
  @Inject() public tableHandler: TableHandlerService;

  async getVariationItem(body: GetVariationItemDTO) {
    const itemId = body.itemId;
    const variations = body.variations;

    const formattedVariations = {};

    for (const variation of variations) {
      formattedVariations[variation.name] =
        variation.value.attributeKey.toLowerCase();
    }

    const variationCombination =
      this.getVariationCombination(formattedVariations);
    const item = await this.prisma.item.findFirst({
      where: { parent: itemId, variantCombination: variationCombination },
    });

    const formattedItemInformation = this.formatResponse(item);
    formattedItemInformation['formattedEstimatedBuyingPrice'] =
      this.utility.formatCurrency(item.estimatedBuyingPrice || 0);
    return formattedItemInformation;
  }

  async createSimpleItem(itemDto: CreateSimpleItemDto) {
    const uomInformation = this.#getUOMInformation(itemDto.uom);

    if (!uomInformation) {
      throw new NotFoundException('Unit of Measurement not found');
    }

    itemDto.sku = itemDto.sku.toUpperCase();
    await this.ensureUniqueSKU(itemDto.sku);
    const tagIds = await this.createTags(itemDto.tags);
    const keywordIds = await this.createKeywords(itemDto.keywords);

    const item = await this.prisma.item.create({
      data: {
        name: itemDto.name,
        sku: itemDto.sku,
        description: itemDto.description,
        estimatedBuyingPrice: itemDto.estimatedBuyingPrice,
        size: itemDto.size,
        isVariation: false,
        uom: uomInformation.key,
        sellingPrice: itemDto.sellingPrice,
        minimumStockLevelPrice: itemDto.minimumStockLevel,
        maximumStockLevelPrice: itemDto.maximumStockLevel,
        enabledInPOS: itemDto.enabledInPOS || false,
        company: { connect: { id: this.utility.companyId } },
        ...(itemDto.brandId && { brand: { connect: { id: itemDto.brandId } } }),
        ...(itemDto.categoryId && { category: { connect: { id: itemDto.categoryId } } }),
        ...(itemDto.branchId && { branch: { connect: { id: itemDto.branchId } } }),
      },
    });

    await this.createItemTags(item.id, tagIds);
    await this.createItemKeywords(item.id, keywordIds);

    return this.formatResponse(item);
  }

  async createItemWithVariants(itemDto: CreateItemWithVariantsDto) {
    itemDto.sku = itemDto.sku.toUpperCase();
    await this.ensureUniqueSKU(itemDto.sku);
    const tagIds = await this.createTags(itemDto.tags);
    const keywordIds = await this.createKeywords(itemDto.keywords);
    const parentItem = await this.createParentItem(itemDto);
    await this.createItemTags(parentItem.id, tagIds);
    await this.createItemKeywords(parentItem.id, keywordIds);
    await this.saveTiers(parentItem.id, itemDto.tiers);

    const variantItems = await this.createVariantItems(
      parentItem.id,
      itemDto.variants,
      itemDto.description,
    );

    return this.formatCreateItemResponse(parentItem, tagIds, variantItems);
  }
  async saveTiers(parentItemId: string, tiers: any[]) {
    for (const tier of tiers) {
      let tierInformation = await this.prisma.itemTier.findFirst({
        where: { itemId: parentItemId, name: tier.key },
      });

      if (!tierInformation) {
        tierInformation = await this.prisma.itemTier.create({
          data: { itemId: parentItemId, name: tier.key },
        });
      }

      for (const attribute of tier.attributes) {
        const checkAttribute = await this.prisma.itemTierAttribute.findFirst({
          where: {
            itemTierId: tierInformation.id,
            attributeKey: attribute.toLowerCase(),
          },
        });

        if (!checkAttribute) {
          await this.prisma.itemTierAttribute.create({
            data: {
              itemTierId: tierInformation.id,
              attributeKey: attribute.toLowerCase(),
            },
          });
        }
      }
    }
  }
  async getItemAdvanceView(
    query: TableQueryDTO,
    body: TableBodyDTO,
    _keyword?: string,
    _tagKey?: string,
  ) {
    this.tableHandler.initialize(query, body, 'itemAdvance');
    const tableQuery = this.tableHandler.constructTableQuery();

    tableQuery.where['isDraft'] = false;
    tableQuery.where['NOT'] = [{ estimatedBuyingPrice: null }, { size: null }];
    tableQuery.where['companyId'] = this.utility.companyId;

    // Get items with brand data
    const itemsWithBrands = await this.prisma.item.findMany({
      ...tableQuery,
      include: { brand: true },
    });

    // Count for pagination
    const countQuery = { ...tableQuery };
    delete countQuery.take;
    delete countQuery.skip;
    delete countQuery.orderBy;
    const totalCount = await this.prisma.item.count({
      where: countQuery.where,
    });

    const pagination = this.tableHandler.paginate(
      totalCount,
      tableQuery.take,
      2,
      Number(query.page),
    );

    const list = await Promise.all(
      itemsWithBrands.map((item) => this.formatAdvancedItem(item)),
    );

    // Get stats for the response
    const stats = await this.getItemStats();

    const currentPage = Number(query.page);

    return {
      list,
      pagination,
      currentPage,
      stats: {
        totalParentItems: stats.totalParentItems,
        totalVariations: stats.totalVariations,
        totalActiveItems: stats.totalActiveItems,
        totalDeletedItems: stats.totalDeletedItems,
        totalItems: totalCount, // Use the totalCount for this filtered query
      },
    };
  }

  async getItemSimpleView(
    query: TableQueryDTO,
    body: TableBodyDTO,
    _keyword?: string,
    _tagKey?: string,
  ) {
    this.tableHandler.initialize(query, body, 'item');
    const tableQuery = this.tableHandler.constructTableQuery();

    tableQuery.skip = (Number(query.page) - 1) * Number(query.perPage);
    tableQuery.take = Number(query.perPage);
    tableQuery.where['parent'] = null;
    tableQuery.where['isDraft'] = false;
    tableQuery.where['companyId'] = this.utility.companyId;

    const totalCount = await this.prisma.item.count({
      where: tableQuery.where,
    });

    // Get items with brand data and keywords
    const baseList = await this.prisma.item.findMany({
      ...tableQuery,
      include: {
        brand: true,
        keywords: {
          include: {
            keyword: true,
          },
        },
      },
    });

    const currentPage = Number(query.page);
    const perPage = Number(query.perPage);
    const siblingsPage = 2;
    const pagination = this.tableHandler.paginate(
      totalCount,
      perPage,
      siblingsPage,
      currentPage,
    );

    baseList.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const list = await Promise.all(
      baseList.map((item) => this.formatSimpleItem(item)),
    );

    // Get stats for the response
    const stats = await this.getItemStats();

    return {
      list,
      pagination,
      currentPage,
      stats: {
        totalParentItems: stats.totalParentItems,
        totalVariations: stats.totalVariations,
        totalActiveItems: stats.totalActiveItems,
        totalDeletedItems: stats.totalDeletedItems,
        totalItems: totalCount, // Use the totalCount already calculated for this filtered query
      },
    };
  }

  async getItemStats() {
    const companyId = this.utility.companyId;

    const [
      totalParentItems,
      totalVariations,
      totalActiveItems,
      totalDeletedItems,
    ] = await Promise.all([
      // Count parent items (isVariation = false, isDraft = false, isDeleted = false)
      this.prisma.item.count({
        where: {
          companyId,
          parent: null,
          isDraft: false,
          isDeleted: false,
        },
      }),
      // Count variations (isVariation = true, isDraft = false, isDeleted = false)
      this.prisma.item.count({
        where: {
          companyId,
          parent: { not: null },
          isDraft: false,
          isDeleted: false,
        },
      }),
      // Count all active items (isDraft = false, isDeleted = false)
      this.prisma.item.count({
        where: {
          companyId,
          isDraft: false,
          isDeleted: false,
        },
      }),
      // Count deleted items (isDeleted = true)
      this.prisma.item.count({
        where: {
          companyId,
          isDeleted: true,
        },
      }),
    ]);

    return {
      totalParentItems,
      totalVariations,
      totalActiveItems,
      totalDeletedItems,
    };
  }

  async softDeleteItemById({ parentId }) {
    const updateResponse = await this.prisma.$transaction(async (tx) => {
      const parentUpdate = await tx.item.update({
        where: { id: parentId },
        data: { isDeleted: true },
      });

      await tx.item.updateMany({
        where: { parent: parentId },
        data: { isDeleted: true },
      });

      return parentUpdate;
    });

    return this.formatResponse(updateResponse);
  }
  async restoreItem({ parentId }) {
    const updateResponse = await this.prisma.$transaction(async (tx) => {
      const parentUpdate = await tx.item.update({
        where: { id: parentId },
        data: { isDeleted: false },
      });

      await tx.item.updateMany({
        where: { parent: parentId },
        data: { isDeleted: false },
      });

      return parentUpdate;
    });

    return this.formatResponse(updateResponse);
  }

  private async getVariations(itemId: string): Promise<string> {
    const tiers = await this.prisma.item.findMany({
      where: { parent: itemId },
      select: { id: true },
    });

    if (tiers.length === 0) {
      return 'No Variation';
    }

    const variationKeys = tiers.map((tier) => tier.id).join(', ');
    return variationKeys;
  }

  private async getVariationCount(itemId: string): Promise<number> {
    const count = await this.prisma.item.count({
      where: { parent: itemId },
    });
    return count;
  }

  async getItemInfoById(id: string) {
    const itemInformation = await this.prisma.item.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
        keywords: {
          include: {
            keyword: true,
          },
        },
      },
    });

    const formattedItemInformation = this.formatResponse(itemInformation);

    if (!itemInformation) {
      throw new NotFoundException('Item not found');
    }

    return formattedItemInformation;
  }

  async getItemAndChildrenInfoById(id: string) {
    const parentItem = await this.prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        estimatedBuyingPrice: true,
        size: true,
        sellingPrice: true,
        minimumStockLevelPrice: true,
        maximumStockLevelPrice: true,
        categoryId: true,
        branchId: true,
        enabledInPOS: true,
      },
    });

    if (!parentItem) {
      throw new NotFoundException('Parent item not found');
    }

    const childItems = await this.prisma.item.findMany({
      where: { parent: id, isDeleted: false },
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        estimatedBuyingPrice: true,
        size: true,
        parent: true,
      },
    });

    const tags = await this.prisma.itemTag.findMany({
      where: { itemId: id },
      select: { tagId: true },
    });

    const tagKeys: string[] = [];
    for (const tag of tags) {
      const tagRecord = await this.prisma.tag.findUnique({
        where: { id: tag.tagId },
        select: { tagKey: true },
      });
      if (tagRecord) {
        tagKeys.push(tagRecord.tagKey);
      }
    }

    // Fetch keywords
    const keywords = await this.prisma.itemKeyword.findMany({
      where: { itemId: id },
      select: { keywordId: true },
    });

    const keywordValues: string[] = [];
    for (const kw of keywords) {
      const keywordRecord = await this.prisma.keyword.findUnique({
        where: { id: kw.keywordId },
        select: { keywordValue: true },
      });
      if (keywordRecord) {
        keywordValues.push(keywordRecord.keywordValue);
      }
    }

    const parentTags = await this.getParentItemTags(id);

    return {
      parent: {
        ...parentItem,
        tags: parentTags.join(', '),
        keywords: keywordValues,
      },
      children: childItems.length > 0 ? childItems : ['No children item'],
    };
  }

  private async getParentItemTags(id: string): Promise<string[]> {
    const parentTags = await this.prisma.itemTag.findMany({
      where: { itemId: id },
      select: { tagId: true },
    });

    const tagKeys: string[] = [];
    for (const tag of parentTags) {
      const tagRecord = await this.prisma.tag.findUnique({
        where: { id: tag.tagId },
        select: { tagKey: true },
      });
      if (tagRecord) {
        tagKeys.push(tagRecord.tagKey);
      }
    }

    return tagKeys;
  }
  private async ensureUniqueSKU(sku: string, id?: string) {
    const existingItem = await this.prisma.item.findFirst({
      where: {
        sku,
        isDeleted: false,
        ...(id && { NOT: { id } }),
      },
    });
    if (existingItem) {
      throw new ConflictException('An item with the same SKU already exists');
    }
  }

  private formatSize(size: number): string {
    return size === 1 ? '1 unit' : `${size} units`;
  }

  private async createParentItem(itemDto: CreateItemWithVariantsDto) {
    const uomInformation = this.#getUOMInformation(itemDto.uom);

    return this.prisma.item.create({
      data: {
        name: itemDto.name,
        sku: itemDto.sku,
        description: itemDto.description,
        estimatedBuyingPrice: null,
        size: null,
        isVariation: false,
        uom: uomInformation.key,
        sellingPrice: itemDto.sellingPrice,
        minimumStockLevelPrice: itemDto.minimumStockLevel,
        maximumStockLevelPrice: itemDto.maximumStockLevel,
        enabledInPOS: itemDto.enabledInPOS || false,
        company: { connect: { id: this.utility.companyId } },
        ...(itemDto.categoryId && { category: { connect: { id: itemDto.categoryId } } }),
        ...(itemDto.branchId && { branch: { connect: { id: itemDto.branchId } } }),
      },
    });
  }

  private async createItemTags(itemId: string, tagIds: string[]) {
    const itemTags = tagIds.map((tagId) => ({ itemId, tagId }));
    await this.prisma.itemTag.createMany({ data: itemTags });
  }

  private async createKeywords(keywordValues: string[]): Promise<string[]> {
    const createdKeywordIds: string[] = [];

    if (keywordValues && keywordValues.length > 0) {
      for (const keywordValue of keywordValues) {
        let keyword = await this.prisma.keyword.findFirst({
          where: { keywordValue: keywordValue.toUpperCase() },
        });

        if (!keyword) {
          keyword = await this.prisma.keyword.create({
            data: { keywordValue: keywordValue.toUpperCase() },
          });
        }

        createdKeywordIds.push(keyword.id);
      }
    }

    return createdKeywordIds;
  }

  private async createItemKeywords(itemId: string, keywordIds: string[]) {
    const itemKeywords = keywordIds.map((keywordId) => ({ itemId, keywordId }));
    await this.prisma.itemKeyword.createMany({ data: itemKeywords });
  }

  private async createVariantItems(
    parentItemId: string,
    variants: CreateVariantDto[],
    parentDescription: string,
  ) {
    const variantItems = [];
    for (const variant of variants) {
      await this.createVariantItem(parentItemId, variant, parentDescription);
    }
    return variantItems;
  }
  private getVariationCombination(variation) {
    let variations = variation; // E.G { color: 'BLUE', size: 'SMALL' }

    // alphabetically arrange variations by keys
    variations = Object.fromEntries(Object.entries(variations).sort());

    // get variation combination
    const variationCombination = Object.values(variations)
      .join('-')
      .toUpperCase();
    return variationCombination;
  }
  private async createVariantItem(
    parentItemId: string,
    variant: CreateVariantDto,
    parentDescription: string,
  ) {
    const variationCombination = this.getVariationCombination(
      variant.variation,
    );

    return this.prisma.item.create({
      data: {
        name: variant.name,
        sku: variant.sku,
        description: variant.description || parentDescription,
        estimatedBuyingPrice: variant.estimatedBuyingPrice,
        size: variant.size,
        isVariation: true,
        parent: parentItemId,
        variantCombination: variationCombination,
        sellingPrice: variant.sellingPrice,
        minimumStockLevelPrice: variant.minimumStockLevel,
        maximumStockLevelPrice: variant.maximumStockLevel,
        company: { connect: { id: this.utility.companyId } },
      },
    });
  }

  private async formatCreateItemResponse(parentItem, tagIds, variantItems) {
    const formattedParentItem = this.formatResponse(parentItem);
    const formattedVariantItems = this.formatResponseList(variantItems);

    const formattedTags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
    });

    const formattedItemTags = formattedTags.map((tag) => ({
      id: tag.id,
      tagKey: tag.tagKey,
    }));

    return {
      data: {
        ...formattedParentItem,
        tags: formattedItemTags,
        variants: formattedVariantItems,
      },
    };
  }

  private async createTags(tagNames: string[]): Promise<string[]> {
    const createdTagIds: string[] = [];

    if (tagNames && tagNames.length > 0) {
      for (const tagName of tagNames) {
        let tag = await this.prisma.tag.findFirst({
          where: { tagKey: tagName.toUpperCase() },
        });

        if (!tag) {
          tag = await this.prisma.tag.create({
            data: { tagKey: tagName.toUpperCase() },
          });
        }

        createdTagIds.push(tag.id);
      }
    }

    return createdTagIds;
  }

  private createTableQuery(select: any, where: any[]): any {
    return {
      select,
      where: { AND: where },
    };
  }

  private async formatAdvancedItem(item: any): Promise<any> {
    const formattedEstimatedBuyingPrice = this.utility.formatCurrency(
      item.estimatedBuyingPrice || 0,
    );

    const formattedItem: any = item;

    // if item has parent - get uom of parent
    if (item.parent) {
      const parentItem = await this.prisma.item.findUnique({
        where: { id: item.parent },
        select: { uom: true },
      });

      formattedItem.uom = parentItem.uom;
    }

    // format uom
    if (formattedItem.uom) {
      formattedItem.uom = UnitOfMeasurementReference.find(
        (data) => data['key'] === formattedItem.uom,
      );
    }

    // additional custom formatting for items
    formattedItem.estimatedBuyingPrice = item.estimatedBuyingPrice
      ? formattedEstimatedBuyingPrice.formatCurrency
      : '-';
    formattedItem.formattedEstimatedBuyingPrice = formattedEstimatedBuyingPrice;

    // Format new price fields
    const formattedSellingPrice = this.utility.formatCurrency(
      item.sellingPrice || 0,
    );
    const formattedMinimumStockLevelPrice = this.utility.formatCurrency(
      item.minimumStockLevelPrice || 0,
    );
    const formattedMaximumStockLevelPrice = this.utility.formatCurrency(
      item.maximumStockLevelPrice || 0,
    );

    formattedItem.sellingPrice = item.sellingPrice
      ? formattedSellingPrice.formatCurrency
      : '0';
    formattedItem.formattedSellingPrice = formattedSellingPrice;
    formattedItem.minimumStockLevelPrice = item.minimumStockLevelPrice
      ? formattedMinimumStockLevelPrice.formatCurrency
      : '0';
    formattedItem.formattedMinimumStockLevelPrice =
      formattedMinimumStockLevelPrice;
    formattedItem.maximumStockLevelPrice = item.maximumStockLevelPrice
      ? formattedMaximumStockLevelPrice.formatCurrency
      : '0';
    formattedItem.formattedMaximumStockLevelPrice =
      formattedMaximumStockLevelPrice;

    formattedItem.size = this.formatSize(item.size);
    formattedItem.tags = await this.getTagsPerItem(item.id);

    // Get stock information from main warehouse
    const mainWarehouseId = await this.ensureMainWarehouse(item.companyId);
    const stock = await this.getItemStock(item.id, mainWarehouseId);
    formattedItem.stock = stock;
    formattedItem.mainWarehouseId = mainWarehouseId;

    if (item.parent) {
      const parentItem = await this.prisma.item.findUnique({
        where: { id: item.parent },
        select: { name: true },
      });
      formattedItem.variationFor = parentItem ? parentItem.name : '-';
    }

    return formattedItem;
  }

  private async formatSimpleItem(item: any): Promise<any> {
    const variationCount = await this.getVariationCount(item.id);

    const formattedEstimatedBuyingPrice = this.utility.formatCurrency(
      item.estimatedBuyingPrice || 0,
    );
    const formattedSellingPrice = this.utility.formatCurrency(
      item.sellingPrice || 0,
    );
    const formattedMinimumStockLevel = this.utility.formatCurrency(
      item.minimumStockLevelPrice || 0,
    );
    const formattedMaximumStockLevel = this.utility.formatCurrency(
      item.maximumStockLevelPrice || 0,
    );

    const formattedItem: any = this.formatResponse(item);

    // additional custom formatting for items
    formattedItem.size = this.formatSize(item.size);
    formattedItem.rawSize = item.size;
    formattedItem.estimatedBuyingPrice = item.estimatedBuyingPrice
      ? formattedEstimatedBuyingPrice.formatCurrency
      : '-';
    formattedItem.formattedEstimatedBuyingPrice = formattedEstimatedBuyingPrice;

    // Format the new price fields consistently - store raw values for form editing
    formattedItem.sellingPrice = item.sellingPrice || 0;
    formattedItem.minimumStockLevel = item.minimumStockLevelPrice || 0;
    formattedItem.maximumStockLevel = item.maximumStockLevelPrice || 0;

    // Store formatted versions separately
    formattedItem.formattedSellingPrice = formattedSellingPrice;
    formattedItem.formattedMinimumStockLevel = formattedMinimumStockLevel;
    formattedItem.formattedMaximumStockLevel = formattedMaximumStockLevel;

    formattedItem.variations =
      variationCount > 0 ? `${variationCount} Variations` : 'No Variation';
    formattedItem.variationCount = variationCount;
    formattedItem.tags = await this.getTagsPerItem(item.id);

    // Get stock information from main warehouse
    const mainWarehouseId = await this.ensureMainWarehouse(item.companyId);
    let stock = 0;

    if (formattedItem.variationCount > 0) {
      // For parent items with variations, sum stock of all variations
      stock = await this.getVariationStock(item.id, mainWarehouseId);
    } else {
      // For simple items, get direct stock
      stock = await this.getItemStock(item.id, mainWarehouseId);
    }

    formattedItem.stock = stock;
    formattedItem.mainWarehouseId = mainWarehouseId;

    // if the item is a parent item, get the variations
    if (formattedItem.estimatedBuyingPrice === '-') {
      const childPrices = await this.getChildPrices(item.id);
      formattedItem.estimatedBuyingPrice = this.formatPrices(childPrices);
    }

    if (!item.size) {
      const childSizes = await this.getChildSizes(item.id);
      formattedItem.size = this.formatSizes(childSizes);
    }

    if (formattedItem.variationCount > 0) {
      formattedItem.variations = await this.getVariants(formattedItem.id);
    }

    return formattedItem;
  }

  private async getVariants(itemId: string) {
    const variants = await this.prisma.itemTier.findMany({
      where: { itemId },
      include: { itemTierAttribute: true },
    });
    return variants;
  }

  private async getChildPrices(parentId: string): Promise<number[]> {
    const childItems = await this.prisma.item.findMany({
      where: { parent: parentId },
      select: { estimatedBuyingPrice: true },
    });
    return childItems
      .map((child) => child.estimatedBuyingPrice)
      .filter((price) => price !== null);
  }

  private formatPrices(prices: number[]): string {
    if (prices.length === 0) return '-';
    const minPrice = this.utility.formatCurrency(
      Number(Math.min(...prices).toFixed(2)),
    );
    const maxPrice = this.utility.formatCurrency(
      Number(Math.max(...prices).toFixed(2)),
    );
    return minPrice.raw === maxPrice.raw
      ? minPrice.formatCurrency
      : `${minPrice.formatCurrency} - ${maxPrice.formatCurrency}`;
  }

  private async getChildSizes(parentId: string): Promise<number[]> {
    const childItems = await this.prisma.item.findMany({
      where: { parent: parentId },
      select: { size: true },
    });
    return childItems
      .map((child) => child.size)
      .filter((size) => size !== null);
  }

  private formatSizes(sizes: number[]): string {
    if (sizes.length === 0) return '-';

    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);

    if (maxSize === 0) {
      return '-';
    }

    return minSize === maxSize
      ? `${minSize} ${minSize === 1 ? 'unit' : 'units'}`
      : `${minSize}-${maxSize} units`;
  }

  async updateItemWithVariants(
    itemId: string,
    itemDto: UpdateItemWithVariantsDto,
  ) {
    await this.ensureUniqueSKU(itemDto.sku, itemId);

    const tagIds = itemDto.tags ? await this.createTags(itemDto.tags) : [];
    const keywordIds = itemDto.keywords ? await this.createKeywords(itemDto.keywords) : [];

    const parentItemUpdate: any = {
      name: itemDto.name,
      sku: itemDto.sku,
      description: itemDto.description,
    };

    // Add optional fields if they exist
    if (itemDto.sellingPrice !== undefined) {
      parentItemUpdate.sellingPrice = itemDto.sellingPrice;
    }
    if (itemDto.minimumStockLevel !== undefined) {
      parentItemUpdate.minimumStockLevelPrice = itemDto.minimumStockLevel;
    }
    if (itemDto.maximumStockLevel !== undefined) {
      parentItemUpdate.maximumStockLevelPrice = itemDto.maximumStockLevel;
    }
    if (itemDto.enabledInPOS !== undefined) {
      parentItemUpdate.enabledInPOS = itemDto.enabledInPOS;
    }
    if (itemDto.categoryId !== undefined) {
      parentItemUpdate.categoryId = itemDto.categoryId;
    }
    if (itemDto.branchId !== undefined) {
      parentItemUpdate.branchId = itemDto.branchId;
    }

    const updatedParentItem = await this.prisma.item.update({
      where: { id: itemId },
      data: parentItemUpdate,
    });

    if (itemDto.tags) {
      await this.prisma.itemTag.deleteMany({ where: { itemId } });
      await this.createItemTags(itemId, tagIds);
    }

    if (itemDto.keywords) {
      await this.prisma.itemKeyword.deleteMany({ where: { itemId } });
      await this.createItemKeywords(itemId, keywordIds);
    }

    const variantItems = await Promise.all(
      itemDto.variants.map(async (variant) => {
        await this.ensureUniqueSKU(variant.sku, variant.id);

        const variantItemUpdate = {
          name: variant.name,
          sku: variant.sku,
          estimatedBuyingPrice: variant.estimatedBuyingPrice,
          size: variant.size,
          sellingPrice: variant.sellingPrice,
          minimumStockLevelPrice: variant.minimumStockLevel,
          maximumStockLevelPrice: variant.maximumStockLevel,
        };

        const updatedVariantItem = await this.prisma.item.update({
          where: { id: variant.id },
          data: variantItemUpdate,
        });

        return updatedVariantItem;
      }),
    );

    return this.formatUpdateItemResponse(
      updatedParentItem,
      tagIds,
      variantItems,
    );
  }

  private async formatUpdateItemResponse(parentItem, tagIds, variantItems) {
    const formattedParentItem = this.formatResponse(parentItem);
    const formattedVariantItems = this.formatResponseList(variantItems);
    const formattedTags =
      tagIds.length > 0
        ? await this.prisma.tag.findMany({ where: { id: { in: tagIds } } })
        : [];
    const formattedItemTags = formattedTags.map((tag) => ({
      id: tag.id,
      tagKey: tag.tagKey,
    }));

    return {
      data: {
        ...formattedParentItem,
        tags: formattedItemTags,
        variants: formattedVariantItems,
      },
    };
  }

  async updateSimpleItem(itemDto: UpdateSimpleItemDto) {
    const uomInformation = this.#getUOMInformation(itemDto.uom);

    itemDto.sku = itemDto.sku.toUpperCase();

    await this.ensureUniqueSKU(itemDto.sku, itemDto.id);
    const tagIds = await this.createTags(itemDto.tags);
    const keywordIds = await this.createKeywords(itemDto.keywords);

    const updateData = {
      name: itemDto.name,
      sku: itemDto.sku,
      description: itemDto.description,
      estimatedBuyingPrice: itemDto.estimatedBuyingPrice,
      size: itemDto.size,
      isDraft: itemDto.isDraft,
      isVariation: false,
      ...(itemDto.sellingPrice !== undefined && {
        sellingPrice: itemDto.sellingPrice,
      }),
      ...(itemDto.minimumStockLevel !== undefined && {
        minimumStockLevelPrice: itemDto.minimumStockLevel,
      }),
      ...(itemDto.maximumStockLevel !== undefined && {
        maximumStockLevelPrice: itemDto.maximumStockLevel,
      }),
      ...(itemDto.brandId !== undefined && { brandId: itemDto.brandId }),
      ...(itemDto.enabledInPOS !== undefined && { enabledInPOS: itemDto.enabledInPOS }),
      ...(itemDto.categoryId !== undefined && { categoryId: itemDto.categoryId }),
      ...(itemDto.branchId !== undefined && { branchId: itemDto.branchId }),
    };

    if (uomInformation) {
      updateData['uom'] = uomInformation.key;
    }

    const item = await this.prisma.item.update({
      where: { id: itemDto.id },
      data: updateData,
    });

    // update tiers
    if (itemDto.tiers) {
      await this.saveTiers(item.id, itemDto.tiers);
    }

    // update variation items or create variation items
    const variants = itemDto.variants;

    if (variants) {
      for (const variant of variants) {
        const variationCombination = this.getVariationCombination(
          variant.variation,
        );
        const variantItem = await this.prisma.item.findFirst({
          where: { parent: item.id, variantCombination: variationCombination },
        });

        if (!variantItem) {
          await this.createVariantItem(item.id, variant, itemDto.description);
        }
      }
    }

    await this.updateItemTags(item.id, tagIds);
    await this.updateItemKeywords(item.id, keywordIds);

    return this.formatResponse(item);
  }

  private async updateItemTags(itemId: string, tagIds: string[]) {
    await this.prisma.itemTag.deleteMany({
      where: { itemId },
    });

    if (tagIds && tagIds.length > 0) {
      const itemTags = tagIds.map((tagId) => ({
        itemId,
        tagId,
      }));

      await this.prisma.itemTag.createMany({
        data: itemTags,
      });
    }
  }

  private async updateItemKeywords(itemId: string, keywordIds: string[]) {
    await this.prisma.itemKeyword.deleteMany({
      where: { itemId },
    });

    if (keywordIds && keywordIds.length > 0) {
      const itemKeywords = keywordIds.map((keywordId) => ({
        itemId,
        keywordId,
      }));

      await this.prisma.itemKeyword.createMany({
        data: itemKeywords,
      });
    }
  }

  private async getTagsPerItem(id: string): Promise<string[]> {
    const item = await this.prisma.item.findUnique({
      where: { id },
      select: { parent: true },
    });

    let itemId = id;

    if (item?.parent) {
      itemId = item.parent;
    }

    const parentTags = await this.prisma.itemTag.findMany({
      where: { itemId },
      select: { tagId: true },
    });

    const tagKeys: string[] = [];
    for (const tag of parentTags) {
      const tagRecord = await this.prisma.tag.findUnique({
        where: { id: tag.tagId },
        select: { tagKey: true },
      });
      if (tagRecord) {
        tagKeys.push(tagRecord.tagKey);
      }
    }

    return tagKeys;
  }

  async getItemListForRefill(
    query: TableQueryDTO,
    body: TableBodyDTO,
    keyword?: string,
    tagKey?: string,
  ) {
    this.tableHandler.initialize(query, body, 'item');

    const baseFilters = [
      { isDeleted: false },
      { isDraft: false },
      { NOT: [{ estimatedBuyingPrice: null }, { size: null }] },
    ];

    let additionalFilters: Prisma.ItemWhereInput = {};

    if (keyword) {
      additionalFilters = {
        ...additionalFilters,
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { sku: { contains: keyword, mode: 'insensitive' } },
          {
            tags: {
              some: {
                tag: { tagKey: { contains: keyword, mode: 'insensitive' } },
              },
            },
          },
        ],
      };
    }

    if (tagKey) {
      additionalFilters = {
        ...additionalFilters,
        tags: {
          some: {
            tag: {
              tagKey: { contains: tagKey, mode: 'insensitive' },
            },
          },
        },
      };
    }

    const tableQuery = this.createTableQuery(
      {
        id: true,
        name: true,
        sku: true,
        description: true,
        size: true,
        estimatedBuyingPrice: true,
        createdAt: true,
      },
      [...baseFilters, additionalFilters],
    );

    tableQuery.skip = (Number(query.page) - 1) * Number(query.perPage);
    tableQuery.take = Number(query.perPage);

    const totalCount = await this.prisma.item.count({
      where: tableQuery.where,
    });

    // Get items with brand data
    const baseList = await this.prisma.item.findMany({
      ...tableQuery,
      include: { brand: true },
    });

    const currentPage = Number(query.page);
    const perPage = Number(query.perPage);
    const siblingsPage = 2;

    const pagination = this.tableHandler.paginate(
      totalCount,
      perPage,
      siblingsPage,
      currentPage,
    );

    const detailedList = await Promise.all(
      baseList.map(async (item: Item) => {
        const itemWithDetails = await this.prisma.item.findUnique({
          where: { id: item.id },
          include: {},
        });

        const nameSkuAttributes = 'UNDER DEVLOPMENT';

        return {
          id: itemWithDetails.id,
          nameSkuAttributes: nameSkuAttributes.trim(),
          estimatedBuyingPrice: itemWithDetails.estimatedBuyingPrice,
          size: itemWithDetails.size,
        };
      }),
    );

    return {
      list: detailedList,
      pagination,
      currentPage,
    };
  }

  async validateItemId(itemId: string) {
    const itemInformation = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true },
    });

    if (!itemInformation)
      throw new NotFoundException({
        message: 'Item Information not found',
        details: `Item Information with ID ${itemId}`,
        errorCode: 'ITEM_NOT_FOUND',
      });
  }

  #getUOMInformation(uom: string) {
    const uomInformation = UnitOfMeasurementReference.find(
      (data) => data['key'] === uom,
    );

    return uomInformation;
  }

  private async ensureMainWarehouse(companyId: number): Promise<string> {
    // Check if main warehouse exists
    const mainWarehouse = await this.prisma.warehouse.findFirst({
      where: {
        companyId,
        isMainWarehouse: true,
        isDeleted: false,
      },
    });

    if (mainWarehouse) {
      return mainWarehouse.id;
    }

    // Create main warehouse if it doesn't exist
    const newWarehouse = await this.prisma.warehouse.create({
      data: {
        name: 'Main Warehouse',
        capacity: 10000,
        warehouseType: 'COMPANY_WAREHOUSE',
        isMainWarehouse: true,
        companyId,
      },
    });

    return newWarehouse.id;
  }

  private async getItemStock(
    itemId: string,
    warehouseId: string,
  ): Promise<number> {
    const inventory = await this.prisma.inventoryItem.findFirst({
      where: { itemId, warehouseId },
    });
    return inventory?.stockCount || 0;
  }

  private async getVariationStock(
    parentItemId: string,
    warehouseId: string,
  ): Promise<number> {
    // Get all variation items for this parent
    const variations = await this.prisma.item.findMany({
      where: {
        parent: parentItemId,
        isDeleted: false,
      },
      select: { id: true },
    });

    // Sum stock for all variations
    let totalStock = 0;
    for (const variation of variations) {
      const stock = await this.getItemStock(variation.id, warehouseId);
      totalStock += stock;
    }

    return totalStock;
  }

  private formatResponse(item: any): any {
    const uomInfo = UnitOfMeasurementReference.find((u) => u.key === item.uom);

    // Extract keywords if available
    const keywords = item.keywords
      ? item.keywords.map((kw) => kw.keyword.keywordValue)
      : [];

    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      description: item.description,
      estimatedBuyingPrice: this.utility.formatCurrency(
        item.estimatedBuyingPrice || 0,
      ),
      sellingPrice: this.utility.formatCurrency(item.sellingPrice || 0),
      minimumStockLevelPrice: this.utility.formatCurrency(
        item.minimumStockLevelPrice || 0,
      ),
      maximumStockLevelPrice: this.utility.formatCurrency(
        item.maximumStockLevelPrice || 0,
      ),
      size: item.size,
      isVariation: item.isVariation,
      parent: item.parent,
      isDeleted: item.isDeleted,
      isDraft: item.isDraft,
      createdAt: this.utility.formatDate(item.createdAt),
      updatedAt: this.utility.formatDate(item.updatedAt),
      uom: uomInfo || null,
      brandId: item.brandId || null,
      brand: item.brand || null,
      categoryId: item.categoryId || null,
      branchId: item.branchId || null,
      keywords: keywords,
      enabledInPOS: item.enabledInPOS || false,
    };
  }

  private formatResponseList(items: Item[]): any[] {
    return items.map((item) => this.formatResponse(item));
  }
}
