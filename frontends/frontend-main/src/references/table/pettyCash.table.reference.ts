const pettyCash = {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  perPage: 10,
  columns: [
    {
      key: 'username',
      label: 'Username',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'firstName',
      label: 'First Name',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'lastName',
      label: 'Last Name',
      sortable: true,
      class: 'text-left',
    },
    { key: 'email', label: 'Email', sortable: true, class: 'text-left' },
    {
      key: 'pettyCashAmount.formatCurrency',
      label: 'Amount',
      sortable: true,
      class: 'text-right',
    },
    {
      key: 'createdAt.dateTime',
      label: 'Created Date',
      sortable: true,
      class: 'text-center',
    },
  ],
  sort: [{ key: 'code', label: 'Code', column: 'code' }],
  filter: [
    { key: 'deleted', label: 'Petty Cash Deleted', column: 'isDeleted' },
  ],
  search: [{ key: 'code', label: 'Code', column: 'code' }],
};

export default pettyCash;
