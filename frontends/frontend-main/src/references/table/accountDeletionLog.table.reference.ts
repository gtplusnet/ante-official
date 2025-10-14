const accountDeletionLog = {
  defaultOrderBy: 'deletedAt',
  defaultOrderType: 'desc',
  perPage: 10,
  columns: [
    {
      key: 'deletedUsername',
      label: 'Deleted Username',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'deletedEmail',
      label: 'Email',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'deletedByUsername',
      label: 'Deleted By',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'reason',
      label: 'Reason',
      sortable: false,
      class: 'text-left',
    },
    {
      key: 'deletionType',
      label: 'Type',
      sortable: true,
      class: 'text-center',
      slot: 'deletionType',
    },
    {
      key: 'deletedAt',
      label: 'Date Deleted',
      sortable: true,
      class: 'text-center',
    },
  ],
  sort: [
    { key: 'deletedUsername', label: 'Username', column: 'deletedUsername' },
    { key: 'deletedEmail', label: 'Email', column: 'deletedEmail' },
    { key: 'deletedByUsername', label: 'Deleted By', column: 'deletedByUsername' },
    { key: 'deletionType', label: 'Type', column: 'deletionType' },
    { key: 'deletedAt', label: 'Date Deleted', column: 'deletedAt' },
  ],
  filter: [
    {
      key: 'soft',
      label: 'Soft Deletes Only',
      column: 'deletionType',
      value: 'soft',
    },
    {
      key: 'hard',
      label: 'Hard Deletes Only',
      column: 'deletionType',
      value: 'hard',
    },
  ],
  search: [
    { key: 'deletedUsername', label: 'Search by Username', column: 'deletedUsername' },
    { key: 'deletedEmail', label: 'Search by Email', column: 'deletedEmail' },
    { key: 'deletedByUsername', label: 'Search by Deleted By', column: 'deletedByUsername' },
    { key: 'reason', label: 'Search by Reason', column: 'reason' },
  ],
};

export default accountDeletionLog;
