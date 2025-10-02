const role = {
  defaultOrderBy: 'label',
  defaultOrderType: 'asc',
  perPage: 10,
  columns: [
    { key: 'id', label: 'ID', sortable: true, class: 'text-left' },
    { key: 'label', label: 'Name', sortable: true, class: 'text-left' },
    {
      key: 'systemModule',
      label: 'Module',
      sortable: true,
      class: 'text-center',
    },
  ],
  sort: [{ key: 'createdAt', label: 'Created At', column: 'createdAt' }],
  filter: [{ key: 'systemModule', label: 'System Module', column: 'systemModule' }],
  search: [{ key: 'label', label: 'Label', column: 'label' }],
};

export default role;
