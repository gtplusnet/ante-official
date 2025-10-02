const developerUserLevel = {
  defaultOrderBy: 'id',
  defaultOrderType: 'desc',
  perPage: 10,
  columns: [
    { key: 'id', label: 'ID', sortable: true, class: 'text-center' },
    { key: 'label', label: 'User Level Name', sortable: true, class: 'text-left' },
    { key: 'systemModule', label: 'Module', sortable: true, class: 'text-center' },
  ],
  sort: [
    { key: 'id', label: 'ID', column: 'id' },
    { key: 'label', label: 'User Level Name', column: 'label' }
  ],
  filter: [
    {
      selectBoxAPI: '/select-box/system-module-list',
      key: 'systemModule',
      label: 'Module',
      column: 'systemModule'
    }
  ],
  search: [{ key: 'label', label: 'User Level Name', column: 'label' }],
};

export default developerUserLevel;
