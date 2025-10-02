const deliveryPending = {
  defaultOrderBy: 'id',
  defaultOrderType: 'desc',
  sort: [],
  columns: [
    {
      key: 'createdAt.dateTime',
      label: 'Transaction Date',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'sourceDeliveryReceipt.code',
      label: 'Source Receipt',
      sortable: true,
      class: 'text-center',
      slot: 'sourceReceipt',
    },
    {
      key: 'fromWarehouse.name',
      label: 'Source Warehouse',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'toWarehouse.name',
      label: 'Destination Warehouse',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'inTransitWarehouse.name',
      label: 'In Transit Warehouse',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'deliveryDate.date',
      label: 'Delivery Deadline',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      class: 'text-center',
      slot: 'status',
    },
  ],
  filter: [
    { key: 'deliveryStatus', label: 'Delivery Status', column: 'status' },
    {
      selectBoxAPI: 'select-box/delivery-status-list',
      key: 'status',
      label: 'Status',
      column: 'status',
    },
  ],
};

export default deliveryPending;
