const inventoryPerWarehouse = {
  defaultOrderBy: 'createdAt',
  sort: [{ key: 'warehouse.name', label: 'Warehouse Name', column: 'name' }],
  columns: [
    {
      key: 'warehouse.name',
      label: 'Warehouse Name',
      sortable: true,
      class: 'text-left',
    },
    { key: 'stockCount', label: 'Stock', sortable: true, class: 'text-left' },
  ],
  filter: [
    { key: 'itemId', label: 'Item ID', column: 'itemId' },
    { key: 'warehouseId', label: 'Warehouse', column: 'warehouseId' },
  ],
  search: [
    {
      key: 'warehouse.name',
      label: 'Warehouse Name',
      column: 'warehouse.name',
    },
  ],
};

export default inventoryPerWarehouse;
