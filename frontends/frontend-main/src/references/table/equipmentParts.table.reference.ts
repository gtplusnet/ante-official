const equipmentParts = {
  defaultOrderBy: 'nextMaintenanceDate',
  defaultOrderType: 'desc',
  sort: [
    { key: 'partName', label: 'Equipment Parts Name', column: 'partName' },
  ],
  filter: [
    { key: 'deleted', label: 'Equipment Parts Deleted', column: 'partName' },
  ],
  search: [
    { key: 'partName', label: 'Equipment Parts Name', column: 'partName' },
  ],
  columns: [
    {
      key: 'partName',
      label: 'Parts Name',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'equipment.name',
      label: 'Equipment',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'equipment.serialCode',
      label: 'Equipment',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'itemsCount',
      label: 'Repair Items',
      sortable: true,
      class: 'text-left',
      slot: 'items-count',
    },
    {
      key: 'lastMaintenanceDate.dateFull',
      label: 'Last Maintenance Date',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'scheduleDay',
      label: 'Cycle',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'nextMaintenanceDate.dateFull',
      label: 'Next Maintenance Date',
      sortable: true,
      class: 'text-left',
      slot: 'maintenance-date',
    },
  ],
};

export default equipmentParts;
