export default {
  defaultOrderBy: 'timestamp',
  defaultOrderType: 'desc',
  search: [
    {
      key: 'personName',
      label: 'Search by Name',
      column: 'personName',
    },
  ],
  filters: [
    {
      key: 'date',
      label: 'Date',
      type: 'date',
      default: 'today', // Will be handled in the component
    },
    {
      key: 'personType',
      label: 'Person Type',
      type: 'select',
      options: [
        { label: 'Student', value: 'student' },
        { label: 'Guardian', value: 'guardian' },
      ],
    },
    {
      key: 'action',
      label: 'Action',
      type: 'select',
      options: [
        { label: 'Check In', value: 'check_in' },
        { label: 'Check Out', value: 'check_out' },
      ],
    },
    {
      key: 'deviceId',
      label: 'Device',
      type: 'select',
      url: 'school/attendance/device/list',
      optionLabel: 'label',
      optionValue: 'value',
    },
  ],
  columns: [
    {
      key: 'personName',
      label: 'Person Name',
      class: 'text-left',
      field: 'personName',
      sortable: true,
    },
    {
      key: 'personType',
      label: 'Type',
      class: 'text-center',
      field: 'personType',
      sortable: true,
      slot: 'badge',
    },
    {
      key: 'action',
      label: 'Action',
      class: 'text-center',
      field: 'action',
      sortable: true,
      slot: 'action',
    },
    {
      key: 'formattedTime',
      label: 'Time',
      class: 'text-center',
      field: 'timestamp',
      sortable: true,
    },
    {
      key: 'deviceId',
      label: 'Device',
      class: 'text-center',
      field: 'deviceId',
      sortable: false,
    },
    {
      key: 'location',
      label: 'Location',
      class: 'text-center',
      field: 'location',
      sortable: false,
    },
  ],
  exportHeaders: [
    'personName',
    'personType',
    'action',
    'formattedDate',
    'formattedTime',
    'deviceId',
    'location',
  ],
};