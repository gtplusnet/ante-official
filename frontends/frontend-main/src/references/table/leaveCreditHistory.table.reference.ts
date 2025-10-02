export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  sort: [
    {
      key: 'createdAt',
      column: 'createdAt',
      label: 'Date',
    },
    {
      key: 'amount',
      column: 'amount',
      label: 'Amount',
    },
    {
      key: 'transactionType',
      column: 'transactionType',
      label: 'Transaction Type',
    },
  ],
  filter: [],
  search: [
    {
      key: 'reason',
      label: 'Search by Reason',
      column: 'reason',
    },
  ],
  columns: [
    {
      key: 'createdAt.dateFull',
      label: 'Date',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'reason',
      label: 'Reason',
      sortable: false,
      class: 'text-left',
    },
    {
      key: 'transactionType',
      label: 'Type',
      sortable: true,
      class: 'text-left',
      slot: 'transactionType',
    },
    {
      key: 'balanceBefore',
      label: 'Balance Before',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'balanceAfter',
      label: 'Balance After',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      class: 'text-left',
    },
  ],
  perPage: 15,
};
