const account = {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  perPage: 10,
  columns: [
    {
      key: 'username',
      label: 'Username',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'firstName',
      label: 'First Name',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'lastName',
      label: 'Last Name',
      sortable: true,
      class: 'text-left',
    },
    { key: 'email', label: 'Email', sortable: true, class: 'text-left' },
    { key: 'role.name', label: 'Role', sortable: true, class: 'text-center' },
    {
      key: 'parent.username',
      label: 'Reports to',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'createdAt.dateFull',
      label: 'Date Created',
      sortable: true,
      class: 'text-center',
    },
  ],
  sort: [{ key: 'name', label: 'Role Name', column: 'name' }],
  filter: [{ key: 'deleted', label: 'Account Deleted', column: 'isDeleted' }],
  search: [
    { key: 'firstName', label: 'Search by First name', column: 'firstName' },
    { key: 'lastName', label: 'Search by Last name', column: 'lastName' },
    { key: 'email', label: 'Search by Email', column: 'email' },
  ],
};

export default account;
