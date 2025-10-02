export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  search: [
    {
      key: 'payrollGroupCode',
      label: 'Search by Payroll Code',
      column: 'payrollGroupCode',
    },
  ],
  columns: [
    {
      key: 'payrollGroupCode',
      label: 'Payroll Code',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'salaryRateType.label',
      label: 'Computation',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'cutoff.cutoffType',
      label: 'Period',
      sortable: true,
      class: 'text-left',
      slot: 'period',
    },
  ],
  perPage: 7,
};
