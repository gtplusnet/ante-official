const warehouseInTransit = {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  perPage: 7,
  sort: [{ key: 'name', label: 'Warehouse Name', column: 'name' }],
  columns: [
    {
      key: 'name',
      label: 'Warehouse Name',
      sortable: true,
      class: 'text-left text-weight-medium',
      slot: 'name',
    },
    {
      key: 'itemTotal',
      label: 'Item Count',
      sortable: true,
      class: 'text-center',
    },
  ],
  filter: [
    { key: 'deleted', label: 'Warehouse Deleted', column: 'isDeleted' },
    {
      key: 'warehouseType',
      label: 'Warehouse Type',
      column: 'warehouseType',
    },
  ],
  search: [{ key: 'name', label: 'Warehouse Name', column: 'name' }],
};

export default warehouseInTransit;
