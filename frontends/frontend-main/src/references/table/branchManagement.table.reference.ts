export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',

  columns: [
    {
      key: 'code',
      label: 'Code',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'name',
      label: 'Name',
      class: 'text-left',
      sortable: true,
    },
    {
      key: 'parent.name',
      label: 'Parent Branch',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'childrenCount',
      label: 'Sub-branches',
      class: 'text-center',
      sortable: false,
    },
    {
      key: 'location.name',
      label: 'Location',
      class: 'text-center',
      sortable: true,
    },
  ],
  search: [
    {
      key: 'code',
      label: 'Search by Branch Code',
      column: 'code',
    },
  ],
  perPage: 7,
  sort: [],
};
