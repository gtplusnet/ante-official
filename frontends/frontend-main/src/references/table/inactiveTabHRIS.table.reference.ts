export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  filter: [
    {
      selectBoxAPI: '/select-box/departmentList',
      key: 'account.roleId',
      label: 'Select Department',
      column: 'account.roleId',
    },

    {
      selectBoxAPI: '/select-box/branch',
      key: 'employeeCode',
      label: 'Select Branch',
      column: 'employeeCode',
    },
  ],
  search: [
    {
      key: 'accountDetails.firstName',
      label: 'Search by First Name',
      column: 'account.firstName',
    },
    {
      key: 'accountDetails.lastName',
      label: 'Search by Last Name',
      column: 'account.lastName',
    },
    {
      key: 'employeeCode',
      label: 'Search by ID',
      column: 'id',
    },
  ],
  columns: [
    {
      key: 'employeeCode',
      label: 'ID',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'accountDetails.firstName',
      label: 'Full Name',
      sortable: true,
      class: 'text-left',
      slot: 'accountDetails',
    },

    {
      key: 'accountDetails.role.roleGroup.name',
      label: 'Department',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'accountDetails.role.name',
      label: 'Position',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'contractDetails.startDate.dateFull',
      label: 'Date Hired',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'accountDetails.createdAt.dateFull',
      label: 'Active Contract Date',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'branch.name',
      label: 'Company',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'contractDetails.employmentStatus',
      label: 'Status',
      sortable: true,
      class: 'text-left',
    },
  ],
  perPage: 7,
};
