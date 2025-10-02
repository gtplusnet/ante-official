const equipmentModel = {
  defaultOrderBy: 'createdAt',
  sort: [{ key: 'name', label: 'Equipment Model Name', column: 'name' }],
  filter: [
    { key: 'deleted', label: 'Equipment Model Deleted', column: 'isDeleted' },
  ],
  search: [{ key: 'name', label: 'Equipment Model Name', column: 'name' }],
};

export default equipmentModel;
