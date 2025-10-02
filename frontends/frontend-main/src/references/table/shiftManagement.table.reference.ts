export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  filter: [{ key: 'id', label: 'Shift ID', column: 'id' }],
  search: [
    {
      key: 'shiftCode',
      label: 'Search by Shift Code',
      column: 'shiftCode',
    },
  ],
  columns: [
    {
      key: 'shiftCode',
      label: 'Shift Code',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'shiftType.label',
      label: 'Shift Type',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'startTime.time',
      label: 'Start Time',
      field: 'startTime.time',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'endTime.time',
      label: 'End Time',
      field: 'endTime.time',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'shiftBreakHours.formatted',
      label: 'Shift Break Hours',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'breakHours.formatted',
      label: 'Flexible Break Hours',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'targetHours.formatted',
      label: 'Target Hours',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'totalWorkHours.formatted',
      label: 'Total Work Hours',
      sortable: true,
      class: 'text-center',
    },
  ],
  sort: [],
};
