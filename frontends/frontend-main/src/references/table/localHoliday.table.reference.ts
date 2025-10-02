export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  filter: [{ key: 'id', label: 'Holiday ID', column: 'id' }],
  search: [
    {
      key: 'name',
      label: 'Search by Holiday Name',
      column: 'name',
    },
    {
      key: 'province.name',
      label: 'Search by Location',
      column: 'province.name',
    },
    {
      key: 'date.dateFull',
      label: 'Search by Date',
      column: 'date.dateFull',
    },
  ],
  columns: [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'type.label',
      label: 'Type',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'province',
      label: 'Location',
      sortable: true,
      class: 'text-left',
      slot: 'province',
    },
    {
      key: 'date.dateFull',
      label: 'Date',
      sortable: true,
      class: 'text-left',
    },
  ],
  sort: [],
};
