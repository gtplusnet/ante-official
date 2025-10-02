export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  search: [
    { key: 'account.firstName', label: 'First Name', column: 'firstName' },
    { key: 'account.lastName', label: 'Last Name', column: 'lastName' },
  ],
  filter: [
    { key: 'isActive', label: 'isActive', column: 'isActive' },
    { key: 'leavePlanId', label: 'Leave Plan', column: 'leavePlanId' }
  ],
  columns: [
    {
      key: 'employee.employeeCode',
      label: 'Employee Code',
      class: 'text-left',
      sortable: true,
    },
    {
      key: 'employee.name',
      label: 'Full Name',
      class: 'text-left',
      sortable: true,
      slot: 'employeeName',
    },
    {
      key: 'settings.totalAnnualCredits',
      label: 'Initial leave credits',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'settings.leaveCreditsGivenUpfront',
      label: 'Total leaves credits given upfront',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'settings.monthlyAccrualCredits',
      label: 'Credits accrue over time (per month)',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'settings.monthDayCreditsAccrual',
      label: 'Number of days of the month',
      class: 'text-center',
      sortable: true,
    },
  ],
  perPage: 10,
  sort: [],
};
