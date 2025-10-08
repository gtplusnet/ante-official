export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',

  columns: [
    {
      key: 'timeInOut',
      label: 'Time In / Time Out',
      class: 'text-left',
      sortable: false,
      customRender: true, // Enable custom rendering in component
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
    {
      key: 'geolocation',
      label: 'Location & IP',
      class: 'text-left',
      sortable: false,
      customRender: true, // Enable custom rendering in component
    },
  ],
  perPage: 10,
  sort: [],
};
