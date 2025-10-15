export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  sort: [],
  filter: [
    {
      key: 'isActive',
      label: 'Status',
      column: 'isActive',
    },
  ],
  search: [
    {
      key: 'fullName',
      label: 'Search by Name',
      column: 'fullName',
    },
    {
      key: 'account.firstName',
      label: 'Search by First Name',
      column: 'account.firstName',
    },
    {
      key: 'account.lastName',
      label: 'Search by Last Name',
      column: 'account.lastName',
    },
    {
      key: 'cashierCode',
      label: 'Search by Cashier Code',
      column: 'cashierCode',
    },
  ],
  columns: [
    {
      key: 'cashierCode',
      label: 'Cashier Code',
      sortable: true,
      class: 'text-left',
      slot: 'cashierCode',
    },
    {
      key: 'account',
      label: 'Full Name',
      sortable: true,
      class: 'text-left',
      slot: 'account',
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      class: 'text-center',
      slot: 'isActive',
    },
  ],
  perPage: 10,
};
