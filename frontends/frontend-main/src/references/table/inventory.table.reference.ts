const inventory = {
  defaultOrderBy: 'createdAt',
  sort: [{ key: 'name', label: 'Inventory Name', column: 'name' }],
  columns: [
    {
      key: 'item.sku',
      label: 'SKU',
      sortable: true,
      class: 'text-left text-weight-medium',
    },
    {
      key: 'item.name',
      label: 'Item Name',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'item.estimatedBuyingPrice',
      label: 'Estimated Cost',
      sortable: true,
      class: 'text-left',
    },
    { key: 'item.size', label: 'Size', sortable: true, class: 'text-left' },
    { key: 'stockCount', label: 'Stock', sortable: true, class: 'text-left' },
  ],
  filter: [
    { key: 'itemId', label: 'Item ID', column: 'itemId' },
    { key: 'warehouseId', label: 'Warehouse', column: 'warehouseId' },
  ],
  search: [{ key: 'item.name', label: 'Item Name', column: 'item.name' }],
};

export default inventory;
