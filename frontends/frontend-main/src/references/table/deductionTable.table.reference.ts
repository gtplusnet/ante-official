export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  search: [
    { key: 'account.firstName', label: 'First Name', column: 'firstName' },
    { key: 'account.lastName', label: 'Last Name', column: 'lastName' },
  ],
  filter: [
    { key: 'isActive', label: 'isActive', column: 'isActive' },
    { key: 'deductionConfigurationId', label: 'Deduction', column: 'deductionConfigurationId' }
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
      key: 'totalAmount.formatCurrency',
      label: 'Loan Amount',
      class: 'text-left',
      sortable: true,
    },
    {
      key: 'monthlyAmortization.formatCurrency',
      label: 'Month Amortizations',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'displayBalance',
      label: 'Total Payment',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'remainingBalance.formatCurrency',
      label: 'Balance',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'effectivityDate.dateFull',
      label: 'Effectivity Date',
      class: 'text-center',
      sortable: true,
    },
  ],
  perPage: 10,
  sort: [],
};
