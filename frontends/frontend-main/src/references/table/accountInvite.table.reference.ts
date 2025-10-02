const accountInvite = {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  perPage: 10,
  columns: [
    {
      key: 'email',
      label: 'Email',
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
      key: 'role.name',
      label: 'Role',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'invitedBy.fullName',
      label: 'Invited By',
      sortable: false,
      class: 'text-center',
    },
    {
      key: 'createdAt.dateFull',
      label: 'Invited Date',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      class: 'text-center',
      slot: 'status',
    },
  ],
  sort: [
    { key: 'createdAt', label: 'Invited Date', column: 'createdAt' },
    { key: 'email', label: 'Email', column: 'email' },
  ],
  filter: [],
  search: [
    { key: 'email', label: 'Search by Email', column: 'email' },
    { key: 'firstName', label: 'Search by First name', column: 'firstName' },
    { key: 'lastName', label: 'Search by Last name', column: 'lastName' },
  ],
};

export default accountInvite;