const developerRole = {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  perPage: 10,
  columns: [
    { key: 'id', label: 'ID', sortable: true, class: 'text-left' },
    { key: 'name', label: 'Role Name', sortable: true, class: 'text-left' },
    {
      key: 'parentRole.name',
      label: 'Parent Role',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'roleGroup.name',
      label: 'Role Group / Department',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'companyId',
      label: 'Company',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'isDeleted',
      label: 'Deleted',
      sortable: true,
      class: 'text-center',
    },
  ],
  sort: [{ key: 'name', label: 'Role Name', column: 'name' }],
  filter: [{ key: 'deleted', label: 'Role Deleted', column: 'isDeleted' }],
  search: [{ key: 'name', label: 'Role Name', column: 'name' }],
};

export default developerRole;
