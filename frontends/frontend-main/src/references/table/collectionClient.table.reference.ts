export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  columns: [
    {
      key: 'name',
      label: 'Client Name',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'contactNumber',
      label: 'Contact Number',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'totalCollection.formatCurrency',
      label: 'Total Project Price',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'outstandingBalance',
      label: 'Outstanding Balance',
      sortable: true,
      class: 'text-center',
      slot: 'totalCollectionBalance',
    },
  ],
};
