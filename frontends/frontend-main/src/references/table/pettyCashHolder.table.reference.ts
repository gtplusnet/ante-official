export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  columns: [
    {
      key: 'account.name',
      label: 'Employee',
      sortable: true,
      class: 'text-left',
      slot: 'account-name'
    },
    {
      key: 'fundAccount.name',
      label: 'Fund Source',
      sortable: true,
      class: 'text-left',
      slot: 'fund-account'
    },
    {
      key: 'currentBalance',
      label: 'Balance',
      sortable: true,
      class: 'text-center',
      slot: 'balance'
    },
    {
      key: 'reason',
      label: 'Reason',
      sortable: false,
      class: 'text-left',
      slot: 'reason'
    },
    {
      key: 'createdAt',
      label: 'Assigned Date',
      sortable: true,
      class: 'text-center',
      slot: 'created-at'
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      class: 'text-center',
      slot: 'status'
    }
  ],
  perPage: 10
};