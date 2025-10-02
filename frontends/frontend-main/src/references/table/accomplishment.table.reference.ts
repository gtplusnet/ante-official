export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  columns: [
    {
      key: 'title',
      label: 'Milestone Title',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'percentage',
      label: 'Percentage',
      sortable: true,
      class: 'text-center',
      slot: 'percentage',
    },
    {
      key: 'reviewedBy.email',
      label: 'Reviewed By',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'accomplishmentDate.date',
      label: 'Date',
      sortable: true,
      class: 'text-center',
    },
  ],
  filter: [{ key: 'project', label: 'Project', column: 'projectId' }],
  sort: [],
  search: [{ key: 'title', label: 'Title', column: 'title' }],
};
