export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  search: [
    { key: 'account.firstName', label: 'First Name', column: 'firstName' },
    { key: 'account.lastName', label: 'Last Name', column: 'lastName' },
  ],
  filter: [
    { key: 'isActive', label: 'Active', column: 'isActive' },
    { key: 'allowanceConfigurationId', label: 'Allowance', column: 'allowanceConfigurationId' }
  ],
  columns: [
    {
      key: 'employeeCode',
      label: 'Employee Code',
      class: 'text-left',
      sortable: true,
    },
    {
      key: 'accountInformation.fullName',
      label: 'Full Name',
      class: 'text-left',
      sortable: true,
    },
    {
      key: 'amount.formatCurrency',
      label: 'Allowance Amount',
      class: 'text-left',
      sortable: true,
    },
    {
      key: '',
      label: 'Calculation Method',
      class: 'text-left',
      sortable: true,
    },
    {
      key: 'deductionPeriod.label',
      label: 'Period Covered',
      class: 'text-left',
      sortable: true,
    },
    {
      key: 'amount.formatCurrency',
      label: 'Total Amount Received',
      class: 'text-left',
      sortable: true,
    },
  ],
  perPage: 10,
  sort: [],
};
