export default {
  defaultOrderBy: 'dateString',
  defaultOrderType: 'desc',

  columns: [
    {
      key: 'dateString',
      label: 'Date',
      class: 'text-left',
      sortable: true,
    },
    {
      key: 'conflictType',
      label: 'Type',
      slot: 'badge',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'description',
      label: 'Description',
      class: 'text-left',
      sortable: false,
    },
    {
      key: 'isResolved',
      label: 'Status',
      slot: 'status',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'resolvedAt',
      label: 'Resolved Date',
      class: 'text-center',
      sortable: true,
    },
  ],
  perPage: 10,
  search: [
    {
      key: 'description',
      label: 'Description',
    },
  ],
  filter: [],
};