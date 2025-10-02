export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',

  columns: [
    {
      key: 'id',
      label: 'ID',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'cutoffCode',
      label: 'Code',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'cutoffType',
      label: 'Type',
      class: 'text-center',
      sortable: true,
      slot: 'type',
    },
    {
      key: 'cutoffConfig.cutoffDay',
      label: 'Day',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'cutoffConfig.firstCutoffPeriod',
      label: 'First',
      class: 'text-center',
      sortable: true,
      slot: 'first'
    },
    {
      key: 'cutoffConfig.lastCutoffPeriod',
      label: 'Last',
      class: 'text-center',
      sortable: true,
      slot: 'last'

    },
    {
      key: 'cutoffConfig.cutoffPeriod',
      label: 'Period',
      class: 'text-center',
      sortable: true,
      slot: 'period'
    },
    {
      key: 'releaseProcessingDays',
      label: 'Days',
      class: 'text-center',
      sortable: true,
    },
  ],
  search: [
    {
      key: 'cutoffCode',
      label: 'Search by Code',
      column: 'cutoffCode',
    },
  ],
  perPage: 7,
  sort: [],
};
