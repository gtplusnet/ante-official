const role = {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  perPage: 10,
  columns: [
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
      key: 'employeeCount',
      label: 'Employee Count',
      sortable: true,
      class: 'text-center',
      slot: 'employeeCount',
    },
  ],
  sort: [{ key: 'name', label: 'Role Name', column: 'name' }],
  filter: [{ key: 'deleted', label: 'Role Deleted', column: 'isDeleted' }],
  search: [{ key: 'name', label: 'Role Name', column: 'name' }],
};

export default role;
