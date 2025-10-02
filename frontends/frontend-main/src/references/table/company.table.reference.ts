const company = {
  defaultOrderBy: 'id',
  defaultOrderType: 'desc',
  sort: [],
  columns: [
    {
      key: 'domainPrefix',
      label: 'Company Code',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'companyName',
      label: 'Company Name',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'businessTypeData.label',
      label: 'Business Type',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'industryData.label',
      label: 'Industry',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'createdAt.dateTime',
      label: 'Created At',
      sortable: true,
      class: 'text-center',
    },
  ],
  filter: [
    { key: 'deliveryStatus', label: 'Delivery Status', column: 'status' },
    {
      key: 'truckLoadStage',
      label: 'Truck Load Stage',
      column: 'truckLoadStage',
    },
  ],
  search: [
    {
      key: 'companyName',
      label: 'Company Name',
      column: 'companyName',
    },
    {
      key: 'domainPrefix',
      label: 'Company Code',
      column: 'domainPrefix',
    },
  ],
};

export default company;
