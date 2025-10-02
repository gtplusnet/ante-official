export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',

  columns: [
    {
      key: 'timeIn.dateTime',
      label: 'Time In',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'timeIn.day',
      label: 'Time In (Day)',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'timeOut.dateTime',
      label: 'Time Out',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'timeOut.day',
      label: 'Time Out (Day)',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'timeSpan.formatted',
      label: 'Hours',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'source.label',
      label: 'Source',
      class: 'text-center',
      sortable: true,
    },
  ],
  perPage: 7,
  sort: [],
};
