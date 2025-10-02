export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  sort: [],
  filter: [
    {
      key: 'isActive',
      label: 'isActive',
      column: 'isActive',
    },
    {
      selectBoxAPI: '/select-box/departmentList',
      key: 'account.role.roleGroupId',
      label: 'Select Department',
      column: 'account.role.roleGroupId',
    },
    {
      selectBoxAPI: '/select-box/branch',
      key: 'branchId',
      label: 'Select Branch',
      column: 'branchId',
    },
  ],
  search: [
    {
      key: 'fullName',
      label: 'Search by Name',
      column: 'fullName', // This will trigger OR search across all name fields
    },
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
      key: 'contractDetails.employmentStatus.label',
      label: 'Status',
      sortable: true,
      class: 'text-left',
    },
  ],
  perPage: 7,
};
