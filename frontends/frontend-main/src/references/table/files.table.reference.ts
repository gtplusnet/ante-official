const files = {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  perPage: 6,
  columns: [
    { key: 'id', label: 'ID', sortable: true, class: 'text-left' },
    { key: 'name', label: 'File Name', sortable: true, class: 'text-left' },
    { key: 'size', label: 'Size', sortable: true, class: 'text-left' },
    {
      key: 'createdAt.dateTime',
      label: 'Upload Created',
      sortable: true,
      class: 'text-left',
    },
  ],
  sort: [{ key: 'name', label: 'File Name', column: 'name' }],
  filter: [{ key: 'taskId', label: 'Task', column: 'taskId' }],
  search: [{ key: 'name', label: 'File Name', column: 'name' }],
};

export default files;
