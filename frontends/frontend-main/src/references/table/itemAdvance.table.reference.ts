const itemAdvance = {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  columns: [
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      class: 'text-left text-weight-medium',
      slot: 'sku',
    },
    { key: 'name', label: 'Item Name', sortable: true, class: 'text-left' },
    { key: 'size', label: 'Size', sortable: true, class: 'text-left' },
    { key: 'uom.label', label: 'UOM', sortable: true, class: 'text-left' },
    {
      key: 'variationFor',
      label: 'Variation For',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'estimatedBuyingPrice',
      label: 'Estimated Cost',
      sortable: true,
      class: 'text-right text-weight-medium',
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      class: 'text-center text-weight-medium',
    },
  ],
  sort: [{ key: 'name', label: 'Item Name', column: 'name' }],
  filter: [
    { key: 'deleted', label: 'Item Deleted', column: 'isDeleted' },
    { key: 'parent', label: 'Parent', column: 'parent' },
  ],
  search: [{ key: 'name', label: 'Item Name', column: 'name' }],
};

export default itemAdvance;
