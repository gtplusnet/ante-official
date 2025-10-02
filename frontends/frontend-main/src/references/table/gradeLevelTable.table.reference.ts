export default {
  defaultOrderBy: 'sequence',
  defaultOrderType: 'asc',
  search: [
    {
      key: 'code',
      label: 'Search by Code',
      column: 'code',
    },
    {
      key: 'name',
      label: 'Search by Name',
      column: 'name',
    },
  ],
  columns: [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'name',
      label: 'Grade Level',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'educationLevel',
      label: 'Education Level',
      sortable: true,
      class: 'text-left',
      slot: 'educationLevel',
    },
    {
      key: 'ageRangeMin',
      label: 'Age Range',
      sortable: false,
      class: 'text-center',
      slot: 'ageRange',
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      class: 'text-center',
      slot: 'status',
    },
  ],
  perPage: 10,
};