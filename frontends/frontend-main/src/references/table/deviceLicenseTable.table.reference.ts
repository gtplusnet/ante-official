export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  search: [
    {
      key: 'licenseKey',
      label: 'Search by License Key',
      column: 'licenseKey',
    },
    {
      key: 'deviceName',
      label: 'Search by Device Name',
      column: 'connectedDevice.deviceName',
    },
    {
      key: 'macAddress',
      label: 'Search by MAC Address',
      column: 'connectedDevice.macAddress',
    },
  ],
  filters: [
    {
      key: 'gateId',
      label: 'Gate',
      type: 'select',
      url: 'school/gate/list',
      optionLabel: 'gateName',
      optionValue: 'id',
    },
    {
      key: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: true },
        { label: 'Inactive', value: false },
      ],
    },
    {
      key: 'isConnected',
      label: 'Connection Status',
      type: 'select',
      options: [
        { label: 'Connected', value: true },
        { label: 'Disconnected', value: false },
      ],
    },
  ],
  columns: [
    {
      key: 'licenseKey',
      label: 'License Key',
      class: 'text-left',
      field: 'licenseKey',
      sortable: true,
    },
    {
      key: 'gate.gateName',
      label: 'Gate',
      class: 'text-center',
      sortable: true,
    },
    {
      key: 'connectedDevice.isConnected',
      label: 'Connection',
      class: 'text-center',
      sortable: false,
    },
    {
      key: 'connectedDevice.deviceName',
      label: 'Connected Device',
      class: 'text-center',
      sortable: false,
    },
    {
      key: 'dateFirstUsed',
      label: 'First Used',
      class: 'text-center',
      field: 'dateFirstUsed',
      sortable: true,
    },
    {
      key: 'dateLastUsed',
      label: 'Last Used',
      class: 'text-center',
      field: 'dateLastUsed',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      class: 'text-center',
      field: 'isActive',
      sortable: true,
    },
  ],
  exportHeaders: [
    'licenseKey',
    'gate.gateName',
    'isActive',
    'dateFirstUsed',
    'dateLastUsed',
    'connectedDevice.deviceName',
    'connectedDevice.macAddress',
    'connectedDevice.ipAddress',
    'connectedDevice.lastSeen',
    'createdAt',
  ],
};