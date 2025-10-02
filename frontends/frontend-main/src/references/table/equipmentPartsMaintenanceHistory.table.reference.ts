const equipmentPartsMaintenanceHistory = {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  sort: [{ key: 'date', label: 'Maintenance Date', column: 'date' }],
  filter: [{ key: 'isWorking', label: 'Is Working', column: 'isWorking' }],
  search: [
    { key: 'description', label: 'Description', column: 'description' },
  ],
  columns: [
    { key: 'id', label: '#', sortable: true, class: 'text-left' },
    {
      key: 'equipmentParts.equipment.name',
      label: 'Equipment Name',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'equipmentParts.equipment.serialCode',
      label: 'Equipment Serial',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'equipmentParts.partName',
      label: 'Part Name',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'checkedBy.username',
      label: 'Checked by',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'createdAt.dateTime',
      label: 'Date Issued',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'maintenanceProof.url',
      label: 'Proof',
      sortable: true,
      class: 'text-center',
      slot: 'image',
    },
    {
      key: 'repairItemPurchaseRequest',
      label: 'Purchase Request',
      sortable: true,
      class: 'text-center',
      slot: 'purchase-request',
    },
    {
      key: 'repairStage',
      label: 'Repair Stage',
      sortable: true,
      class: 'text-center',
      slot: 'badge',
    },
  ],
};

export default equipmentPartsMaintenanceHistory;
