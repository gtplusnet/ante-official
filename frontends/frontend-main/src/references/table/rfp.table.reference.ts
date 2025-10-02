export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  columns: [
    { key: 'id', label: 'ID', sortable: true, class: 'text-left' },
    {
      key: 'payeeType.label',
      label: 'Payee Type',
      sortable: true,
      class: 'text-left',
    },
    { key: 'payee', label: 'Payee', sortable: true, class: 'text-left' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      class: 'text-center',
      slot: 'badge',
    },
    {
      key: 'amount.formatCurrency',
      label: 'Amount',
      sortable: true,
      class: 'text-left',
    },
  ],
  sort: [],
  filter: [
    { key: 'deleted', label: 'RFP Deleted', column: 'isDeleted' },
    { key: 'status', label: 'Status', column: 'status' },
  ],
  search: [{ key: 'code', label: 'Code', column: 'code' }],
};
