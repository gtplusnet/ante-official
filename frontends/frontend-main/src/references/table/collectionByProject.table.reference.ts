export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  filter: [{ key: 'clientId', label: 'Client', column: 'clientId' }],
  columns: [
    {
      key: 'name',
      label: 'Project Name',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'budget.formatCurrency',
      label: 'Project Price',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'totalCollectionBalance.formatCurrency',
      label: 'Outstanding Balance',
      sortable: true,
      class: 'text-center',
      slot: 'totalCollectionBalance',
    },
  ],
};
