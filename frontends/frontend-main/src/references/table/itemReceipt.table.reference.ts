const itemReceipt = {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  columns: [
    { key: 'code', label: 'Code', sortable: true, class: 'text-left' },
    {
      key: 'type.label',
      label: 'Description',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'createdAt.dateTime',
      label: 'Created Date',
      sortable: true,
      class: 'text-left ',
    },
    {
      key: 'totalPayableAmount.formatCurrency',
      label: 'Amount',
      sortable: true,
      class: 'text-right text-weight-medium',
      slot: 'amount',
    },
  ],
  perPage: 7,
  sort: [],
  filter: [
    { key: 'warehouseId', label: 'Warehouse', column: 'warehouseId' },
    { key: 'supplierId', label: 'Supplier', column: 'supplierId' },
    { key: 'type', label: 'Type', column: 'type' },
  ],
  search: [{ key: 'code', label: 'Code', column: 'code' }],
};

export default itemReceipt;
