export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  columns: [
    {
      key: 'createdAt.dateTime',
      label: 'Date',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'code.label',
      label: 'Description',
      sortable: true,
      class: 'text-left',
    },
    { key: 'memo', label: 'Remarks', sortable: true, class: 'text-center' },
    {
      key: 'balanceBefore.formatCurrency',
      label: 'Balance Before',
      sortable: true,
      class: 'text-right',
    },
    {
      key: 'balanceAfter.formatCurrency',
      label: 'Balance After',
      sortable: true,
      class: 'text-right',
    },
    {
      key: 'amount.formatCurrency',
      label: 'Amount',
      sortable: true,
      class: 'text-right text-weight-medium',
      slot: 'amount',
    },
  ],
  sort: [],
  filter: [
    { key: 'fundAccountId', label: 'Fund Account', column: 'fundAccountId' },
  ],
  search: [{ key: 'code', label: 'Description', column: 'code' }],
};
