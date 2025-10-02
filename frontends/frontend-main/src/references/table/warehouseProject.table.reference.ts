const warehouseProject = {
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
      key: 'project.name',
      label: 'Project',
      sortable: true,
      class: 'text-left text-weight-medium',
    },
    {
      key: 'location.region.name',
      label: 'Region',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'location.province.name',
      label: 'Province',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'location.municipality.name',
      label: 'Municipality',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'location.barangay.name',
      label: 'Barangay',
      sortable: true,
      class: 'text-left',
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

export default warehouseProject;
