export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  filter: [{ key: 'projectId', label: 'Project', column: 'projectId' }],
  columns: [
    {
      key: 'description',
      label: 'Milestone Title',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'type.label',
      label: 'Type',
      sortable: true,
      class: 'text-center',
    },

    {
      key: 'accomplishmentReference.percentage',
      label: 'Percentage',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'accomplishmentReference.reviewedBy.email',
      label: 'Review By',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'amount.formatCurrency',
      label: 'Amount Billed',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'amountPaid.formatCurrency',
      label: 'Amount Paid',
      sortable: true,
      class: 'text-center',
    },
    {
      key: '',
      label: 'Date',
      sortable: true,
      class: 'text-center',
    },
  ],
};
