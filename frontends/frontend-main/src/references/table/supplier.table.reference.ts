export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  sort: [{ key: 'name', label: 'Supplier Name', column: 'name' }],
  filter: [
    { key: 'deleted', label: 'Supplier Deleted', column: 'isDeleted' },
  ],
  search: [{ key: 'name', label: 'Supplier Name', column: 'name' }],
  columns: [
    {
      key: 'name',
      label: 'Contact Name',
      sortable: true,
      class: 'text-left',
      slot: 'name',
    },
    { key: 'email', label: 'Email', sortable: true, class: 'text-left' },
    {
      key: 'taxType.label',
      label: 'Tax Type',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'paymentTerms.label',
      label: 'Payment Terms',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'createdAt.dateFull',
      label: 'Create Date',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'payableAmount.formatCurrency',
      label: 'Balance',
      sortable: true,
      class: 'text-left text-weight-medium text-red',
    },
  ],
};
