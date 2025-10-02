export default {
  defaultOrderBy: 'description',
  defaultOrderType: 'desc',
  filter: [
    { key: 'isForReview', label: 'For Review', column: 'isForReview' },
  ],
  columns: [
    {
      key: 'id',
      label: '#',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'project.name',
      label: 'Project',
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
      key: 'description',
      label: 'Description',
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
      class: 'text-center text-weight-medium',
    },
  ],
  sort: [],
};
