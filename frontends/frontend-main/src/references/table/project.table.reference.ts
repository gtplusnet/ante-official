const project = {
  defaultOrderBy: 'id',
  defaultOrderType: 'desc',
  sort: [{ key: 'name', label: 'Project Name', column: 'name' }],
  filter: [
    { key: 'deleted', label: 'Project Deleted', column: 'isDeleted' },
    { key: 'lead', label: 'Project Lead', column: 'isLead' },
  ],
  search: [{ key: 'name', label: 'Project Name', column: 'name' }],
};

export default project;
