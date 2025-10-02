const inventoryHistory = {
  defaultOrderBy: 'id',
  defaultOrderType: 'desc',
  sort: [{ key: 'name', label: 'Inventory Name', column: 'name' }],
  columns: [
    {
      key: 'itemReceipt.createdAt.dateTime',
      label: 'Transaction Date',
      sortable: true,
      class: 'text-left text-weight-medium',
    },
    {
      key: 'itemReceipt.code',
      label: 'Transaction Receipt',
      sortable: true,
      class: 'text-center',
      slot: 'code',
    },
    {
      key: 'partnerReceipt.code',
      label: 'Reference Receipt',
      sortable: true,
      class: 'text-center',
      slot: 'partnerCode',
    },
    {
      key: 'itemReceipt.type.label',
      label: 'Description',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'quantity',
      label: 'Quantity',
      sortable: true,
      class: 'text-center',
      slot: 'quantity',
    },
    {
      key: 'quantityBefore',
      label: 'Quantity Before',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'quantityAfter',
      label: 'Quantity After',
      sortable: true,
      class: 'text-center',
    },
  ],
  filter: [
    { key: 'itemId', label: 'Item ID', column: 'itemId' },
    {
      key: 'warehouseId',
      label: 'Item ID',
      column: 'itemReceipt.warehouseId',
    },
    { key: 'type', label: 'Type', column: 'itemReceipt.type' },
  ],
};

export default inventoryHistory;
