export default {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  columns: [
    { 
      key: 'receiptNumber', 
      label: 'Receipt #', 
      sortable: true, 
      class: 'text-left', 
      slot: 'receiptNumber' 
    },
    { 
      key: 'createdAt', 
      label: 'Date Created', 
      sortable: true, 
      class: 'text-left',
      slot: 'createdAt'
    },
    { 
      key: 'requestedBy', 
      label: 'Requested By', 
      sortable: true, 
      class: 'text-left', 
      slot: 'requestedBy' 
    },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true, 
      class: 'text-right', 
      slot: 'amount' 
    },
    { 
      key: 'expenseCategory', 
      label: 'Category', 
      sortable: true, 
      class: 'text-left', 
      slot: 'expenseCategory' 
    },
    { 
      key: 'status.label', 
      label: 'Status', 
      sortable: true, 
      class: 'text-center',
      slot: 'status'
    },
    { 
      key: 'isAiExtracted', 
      label: 'AI', 
      sortable: true, 
      class: 'text-center', 
      slot: 'isAiExtracted' 
    },
    { 
      key: 'attachmentProof', 
      label: 'Receipt', 
      sortable: false, 
      class: 'text-center', 
      slot: 'proof' 
    }
  ],
  sort: [],
  filter: [],
};
