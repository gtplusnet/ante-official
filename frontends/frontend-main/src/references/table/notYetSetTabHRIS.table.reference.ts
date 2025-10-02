export default {
  defaultOrderBy: 'firstName',
  defaultOrderType: 'asc',
  columns: [
    {
      key: 'username',
      label: 'Username',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'firstName',
      label: 'Full Name',
      sortable: true,
      class: 'text-left',
      slot: 'fullName',
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'role.name',
      label: 'Position',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'createdAt.dateTime',
      label: 'Date Created',
      sortable: true,
      class: 'text-center',
    },
  ],
  perPage: 7,
};
