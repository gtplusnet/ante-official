export default {
  defaultOrderBy: 'createdAt',
  sort: [{ key: 'name', label: 'Location Name', column: 'name' }],
  filter: [
    { key: 'deleted', label: 'Location Deleted', column: 'isDeleted' },
  ],
  search: [{ key: 'name', label: 'Location Name', column: 'name' }],
};
