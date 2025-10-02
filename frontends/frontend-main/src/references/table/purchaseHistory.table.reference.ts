const purchaseHistory = {
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
      key: 'itemRate.formatCurrency',
      label: 'Price',
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
      key: 'total.formatCurrency',
      label: 'Total',
      sortable: true,
      class: 'text-right',
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

export default purchaseHistory;
