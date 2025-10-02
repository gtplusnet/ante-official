export default {
  defaultOrderBy: 'createdAt',
  columns: [
    {
      key: 'name',
      label: 'Account Name',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'accountNumber',
      label: 'Account Number',
      sortable: true,
      class: 'text-left',
    },
    { key: 'type.label', label: 'Type', sortable: true, class: 'text-left' },
    {
      key: 'balance.formatCurrency',
      label: 'Balance',
      sortable: true,
      class: 'text-left text-weight-medium text-primary',
    },
  ],
  sort: [],
  filter: [{ key: 'deleted', label: 'Role Deleted', column: 'isDeleted' }],
  search: [
    { key: 'name', label: 'Account Name', column: 'name' },
    {
      key: 'accountNumber',
      label: 'Account Number',
      column: 'accountNumber',
    },
    { key: 'type', label: 'Account Type', column: 'type' },
  ],
};
