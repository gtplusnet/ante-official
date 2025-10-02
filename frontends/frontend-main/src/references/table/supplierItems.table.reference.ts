export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  sort: [{ key: 'name', label: 'Supplier Name', column: 'name' }],
  filter: [
    { key: 'supplierId', label: 'Supplier ID', column: 'supplierId' },
    { key: 'itemId', label: 'Item ID', column: 'itemId' },
  ],
  search: [
    { key: 'item.name', label: 'Item Name', column: 'item.name' },
    { key: 'supplier.name', label: 'Supplier Name', column: 'supplier.name' },
  ],
  columns: [
    {
      key: 'supplier.name',
      label: 'Supplier Name',
      sortable: true,
      class: 'text-left',
    },
    { key: 'item.name', label: 'Item', sortable: true, class: 'text-left' },
    {
      key: 'updatedAt.dateFull',
      label: 'Last Update',
      sortable: true,
      class: 'text-left',
    },
    {
      key: 'supplierPrice.formatCurrency',
      label: 'Supplier Price',
      sortable: true,
      class: 'text-right text-weight-medium',
    },
  ],
};
