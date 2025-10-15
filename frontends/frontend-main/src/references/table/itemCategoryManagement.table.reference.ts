const itemCategoryManagement = {
  defaultOrderBy: 'name',
  defaultOrderType: 'asc',
  columns: [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      class: 'text-left text-weight-medium',
    },
    {
      key: 'name',
      label: 'Category Name',
      sortable: true,
      class: 'text-left text-weight-medium',
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'parent.name',
      label: 'Parent Category',
      sortable: false,
      class: 'text-left',
    },
    {
      key: 'childrenCount',
      label: 'Sub-categories',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'itemCount',
      label: 'Items',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      class: 'text-center',
      slot: 'isActive',
    },
  ],
  sort: [
    { key: 'name', label: 'Category Name', column: 'name' },
    { key: 'code', label: 'Code', column: 'code' },
  ],
  filter: [
    { key: 'active', label: 'Active Only', column: 'isActive' },
  ],
  search: [
    { key: 'name', label: 'Category Name', column: 'name' },
    { key: 'code', label: 'Code', column: 'code' },
  ],
};

export default itemCategoryManagement;
