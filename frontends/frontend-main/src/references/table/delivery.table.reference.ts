const delivery = {
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
      key: 'toWarehouse.name',
      label: 'Receiving Warehouse',
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
  ],
  filter: [
    { key: 'deliveryStatus', label: 'Delivery Status', column: 'status' },
    {
      key: 'truckLoadStage',
      label: 'Truck Load Stage',
      column: 'truckLoadStage',
    },
  ],
};

export default delivery;
