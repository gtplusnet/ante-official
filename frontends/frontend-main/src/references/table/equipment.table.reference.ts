const equipment = {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  columns: [
    {
      key: 'name',
      label: 'Item Name',
      sortable: true,
      class: 'text-left text-weight-medium',
    },
    {
      key: 'serialCode',
      label: 'Serial Code',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'equipmentType.label',
      label: 'Type',
      sortable: true,
      class: 'text-left',
    },
    { key: 'brand.name', label: 'Brand', sortable: true, class: 'text-left' },
    {
      key: 'currentWarehouse.name',
      label: 'Current Warehouse',
      sortable: true,
      class: 'text-left',
    },
  ],
  sort: [{ key: 'name', label: 'Equipment Name', column: 'name' }],
  filter: [
    { key: 'deleted', label: 'Equipment Deleted', column: 'isDeleted' },
  ],
  search: [{ key: 'name', label: 'Equipment Name', column: 'name' }],
};

export default equipment;
