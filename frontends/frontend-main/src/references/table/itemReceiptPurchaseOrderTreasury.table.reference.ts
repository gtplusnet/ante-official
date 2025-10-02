const itemReceiptPurchaseOrderTreasury = {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  columns: [
    {
      key: 'purchaseOrder.id',
      label: 'ID',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      class: 'text-left',
      slot: 'code',
    },
    {
      key: 'createdAt.dateTime',
      label: 'Created Date',
      sortable: true,
      class: 'text-left ',
    },
    {
      key: 'supplier.name',
      label: 'Supplier',
      sortable: true,
      class: 'text-center ',
    },
    {
      key: 'project.name',
      label: 'Project',
      sortable: true,
      class: 'text-center ',
    },
    {
      key: 'taxType.label',
      label: 'Tax Type',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'totalPayableAmount.formatCurrency',
      label: 'Amount',
      sortable: true,
      class: 'text-right',
    },
    {
      key: 'purchaseOrder.balance.formatCurrency',
      label: 'Open Balance',
      sortable: true,
      class: 'text-right text-weight-medium text-red',
    },
    {
      key: 'isItemInventoryPosted',
      label: 'Delivery Status',
      sortable: true,
      class: 'text-center',
      slot: 'delivery-status',
    },
  ],
  perPage: 7,
  sort: [],
  filter: [
    { key: 'deleted', label: 'Item Deleted', column: 'isDeleted' },
    {
      selectBoxAPI: 'select-box/delivery-status-list',
      key: 'deliveryStatus',
      label: 'Delivery Status',
      column: 'delivery.status',
    },
    {
      selectBoxAPI: 'select-box/delivery-terms-list',
      key: 'deliveryTerms',
      label: 'Delivery Terms',
      column: 'deliveryTerms',
    },
  ],
  search: [{ key: 'code', label: 'Code', column: 'code' }],
};

export default itemReceiptPurchaseOrderTreasury;
