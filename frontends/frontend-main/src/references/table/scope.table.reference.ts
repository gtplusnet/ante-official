const scope = {
  defaultOrderBy: 'id',
  perPage: 10,
  columns: [
    { key: 'name', label: 'Scope Name', sortable: true, class: 'text-left' },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      class: 'text-left',
    },
  ],
  sort: [{ key: 'name', label: 'Scope Name', column: 'name' }],
  filter: [{ key: 'deleted', label: 'Scope Deleted', column: 'isDeleted' }],
  search: [
    { key: 'name', label: 'Scope Name', column: 'name' },
    { key: 'description', label: 'Description', column: 'name' },
  ],
};

export default scope;
