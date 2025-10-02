export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  sort: [
    {
      key: 'employee.name',
      column: 'employee.account.lastName',
      label: 'Employee Name',
    },
    {
      key: 'effectiveDate',
      column: 'effectiveDate',
      label: 'Effective Date',
    },
    {
      key: 'currentCredits',
      column: 'currentCredits',
      label: 'Current Credits',
    },
  ],
  filter: [
    {
      key: 'isActive',
      label: 'Status',
      column: 'isActive',
      type: 'select',
      options: [
        { label: 'Active', value: true },
        { label: 'Inactive', value: false },
      ],
    },
    {
      selectBoxAPI: '/select-box/branch',
      key: 'employee.branchId',
      label: 'Select Branch',
      column: 'employee.branchId',
    },
  ],
  search: [
    {
      key: 'employee.name',
      label: 'Search by Employee Name',
      column: 'employee.account.firstName',
    },
    {
      key: 'employee.employeeCode',
      label: 'Search by Employee Code',
      column: 'employee.employeeCode',
    },
  ],
  columns: [
    {
      key: 'employee.name',
      label: 'Employee Name',
      sortable: true,
      class: 'text-left',
      slot: 'employeeName',
    },
    {
      key: 'employee.department',
      label: 'Department',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'employee.position',
      label: 'Position',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'credits.current',
      label: 'Current Credits',
      sortable: true,
      class: 'text-right',
      slot: 'currentCredits',
    },
    {
      key: 'credits.used',
      label: 'Used Credits',
      sortable: true,
      class: 'text-right',
      slot: 'usedCredits',
    },
    {
      key: 'credits.remaining',
      label: 'Remaining',
      sortable: true,
      class: 'text-right',
      slot: 'remainingCredits',
    },
    {
      key: 'dates.effectiveDate.dateFull',
      label: 'Effective Date',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'status.label',
      label: 'Status',
      sortable: true,
      class: 'text-center',
      slot: 'status',
    },
  ],
  perPage: 10,
};