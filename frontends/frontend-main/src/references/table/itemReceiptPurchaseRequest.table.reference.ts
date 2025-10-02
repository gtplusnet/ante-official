const itemReceiptPurchaseRequest = {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  columns: [
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
      key: 'project.name',
      label: 'Project',
      sortable: true,
      class: 'text-center ',
    },
    {
      key: 'warehouse.name',
      label: 'Destination Warehouse',
      sortable: true,
      class: 'text-center ',
    },
    {
      key: 'purchaseRequest.deliveryDate.dateFull',
      label: 'Delivery Deadline',
      sortable: true,
      class: 'text-center ',
    },
    {
      key: 'purchaseRequest.status.label',
      label: 'Status',
      sortable: true,
      class: 'text-center',
      slot: 'status',
    },
    {
      key: 'totalPayableAmount.formatCurrency',
      label: 'Amount',
      sortable: true,
      class: 'text-right text-weight-medium',
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

export default itemReceiptPurchaseRequest;
