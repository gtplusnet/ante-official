export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  perPage: 5,
  sort: [{ key: 'id', label: 'ID', column: 'id' }],
  search: [
    { key: 'updateBy.email', label: 'Email', column: 'updateBy' },
    { key: 'supplier.name', label: 'Supplier Name', column: 'supplier.name' },
  ],
  filter: [
    { key: 'supplierId', label: 'Supplier ID', column: 'supplierId' },
    { key: 'itemId', label: 'Item ID', column: 'itemId' },
  ],
  columns: [
    {
      key: 'updateBy.email',
      label: 'Updated By',
      sortable: true,
      class: 'text-left',
      slot: 'name',
    },
    {
      key: 'supplier.name',
      label: 'Supplier',
      sortable: true,
      class: 'text-center',
    },
    { key: 'item.name', label: 'Item', sortable: true, class: 'text-center' },
    {
      key: 'createdAt.dateTime',
      label: 'Timestamp',
      sortable: true,
      class: 'text-center',
    },
    {
      key: 'supplierPrice.formatCurrency',
      label: 'Updated Price',
      sortable: true,
      class: 'text-right text-weight-medium',
    },
  ],
};
