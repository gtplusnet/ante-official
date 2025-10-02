const roleGroup = {
  defaultOrderBy: 'createdAt',
  perPage: 10,
  columns: [
    {
      key: 'name',
      label: 'Role Group Name',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      class: 'text-left',
    },
  ],
  sort: [{ key: 'name', label: 'Role Group Name', column: 'name' }],
  filter: [
    { key: 'deleted', label: 'Role Group Deleted', column: 'isDeleted' },
  ],
  search: [{ key: 'name', label: 'Role Group Name', column: 'name' }],
};

export default roleGroup;
