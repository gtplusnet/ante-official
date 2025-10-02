const boardLane = {
  defaultOrderBy: 'createdAt',
  sort: [{ key: 'name', label: 'Board Lane Name', column: 'name' }],
  filter: [
    { key: 'deleted', label: 'Board Lane Deleted', column: 'isDeleted' },
  ],
  search: [{ key: 'name', label: 'Board Lane Name', column: 'name' }],
};

export default boardLane;
