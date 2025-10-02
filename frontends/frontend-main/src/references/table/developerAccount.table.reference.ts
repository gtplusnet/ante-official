const developerAccount = {
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
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'company.companyName',
      label: 'Company',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'role.name',
      label: 'Role',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'isDeveloper',
      label: 'Developer',
      sortable: true,
      class: 'text-center',
      slot: 'developer',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      class: 'text-center',
      slot: 'status',
    },
    {
      key: 'createdAt.dateFull',
      label: 'Date Created',
      sortable: true,
      class: 'text-center',
    },
  ],
  sort: [
    { key: 'username', label: 'Username', column: 'username' },
    { key: 'firstName', label: 'First Name', column: 'firstName' },
    { key: 'lastName', label: 'Last Name', column: 'lastName' },
    { key: 'company', label: 'Company', column: 'company.companyName' },
  ],
  filter: [
    { key: 'active', label: 'Active Users Only', column: 'isActive' },
    { key: 'deleted', label: 'Include Deleted', column: 'isDeleted' },
    {
      selectBoxAPI: '/select-box/company-list',
      key: 'companyId',
      label: 'Company',
      column: 'companyId'
    }
  ],
  search: [
    { key: 'username', label: 'Search by Username', column: 'username' },
    { key: 'firstName', label: 'Search by First name', column: 'firstName' },
    { key: 'lastName', label: 'Search by Last name', column: 'lastName' },
    { key: 'email', label: 'Search by Email', column: 'email' },
    { key: 'company', label: 'Search by Company', column: 'company.companyName' },
  ],
};

export default developerAccount;