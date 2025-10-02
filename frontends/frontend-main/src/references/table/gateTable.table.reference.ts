export default {
  defaultOrderBy: 'gateName',
  defaultOrderType: 'asc',
  search: [
    {
      key: 'gateName',
      label: 'Search by Gate Name',
      column: 'gateName',
    },
  ],
  columns: [
    {
      key: 'gateName',
      label: 'Gate Name',
      sortable: true,
      class: 'text-left',
      slot: 'gateName',
    },
    {
      key: 'createdAt',
      label: 'Created At',
      sortable: true,
      class: 'text-center',
      slot: 'createdAt',
    },
    {
      key: 'updatedAt',
      label: 'Updated At',
      sortable: true,
      class: 'text-center',
      slot: 'updatedAt',
    },
  ],
  perPage: 10,
};