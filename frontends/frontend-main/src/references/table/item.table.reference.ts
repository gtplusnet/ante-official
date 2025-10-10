const item = {
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
    { key: 'size', label: 'Size', sortable: true, class: 'text-center' },
    { key: 'uom.label', label: 'UOM', sortable: true, class: 'text-left' },
    { key: 'brandDisplay', label: 'Brand', sortable: true, class: 'text-left' },
    { key: 'categoryDisplay', label: 'Category', sortable: true, class: 'text-left' },
    { key: 'branchDisplay', label: 'Branch', sortable: true, class: 'text-left' },
    {
      key: 'variationCount',
      label: 'Variations',
      sortable: true,
      class: 'text-center',
      slot: 'variationCount',
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
  filter: [{ key: 'deleted', label: 'Item Deleted', column: 'isDeleted' }],
  search: [{ key: 'name', label: 'Item Name', column: 'name' }],
};

export default item;
