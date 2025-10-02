// Mirror the backend Prisma enum from schema.prisma
export enum PettyCashTransactionType {
  INITIAL = 'INITIAL',
  REFILL = 'REFILL',
  DEDUCTION = 'DEDUCTION',
  LIQUIDATION = 'LIQUIDATION',
  RETURN = 'RETURN',
  TRANSFER = 'TRANSFER'
}

// Type mapping configuration matching backend types
export const TRANSACTION_TYPE_CONFIG = {
  [PettyCashTransactionType.INITIAL]: {
    icon: 'o_screen_share',
    color: '#4DB6AC',
    bgColor: '#E0F2F1',
    label: 'Initial Assignment',
    cssClass: 'assignment'
  },
  [PettyCashTransactionType.REFILL]: {
    icon: 'border_inner',
    color: '#42A5F5',
    bgColor: '#E3F2FD',
    label: 'Refill',
    cssClass: 'refill'
  },
  [PettyCashTransactionType.DEDUCTION]: {
    icon: 'o_indeterminate_check_box',
    color: '#FF7043',
    bgColor: '#FBE9E7',
    label: 'Manual Deduction',
    cssClass: 'deduction'
  },
  [PettyCashTransactionType.LIQUIDATION]: {
    icon: 'o_assignment_turned_in',
    color: 'var(--q-secondary)',
    bgColor: '#615FF61F',
    label: 'Liquidation',
    cssClass: 'liquidation'
  },
  [PettyCashTransactionType.RETURN]: {
    icon: 'undo',
    color: '#66BB6A',
    bgColor: '#E8F5E9',
    label: 'Return to Fund',
    cssClass: 'return'
  },
  [PettyCashTransactionType.TRANSFER]: {
    icon: 'swap_vert',
    color: '#9c27b0',
    bgColor: '#f3e5f5',
    label: 'Transfer',
    cssClass: 'transfer'
  }
};

// Helper to get amount prefix based on transaction type
export function getAmountPrefix(type: PettyCashTransactionType, isTransferReceived = false): string {
  const deductionTypes = [
    PettyCashTransactionType.DEDUCTION,
    PettyCashTransactionType.LIQUIDATION,
    PettyCashTransactionType.RETURN
  ];
  
  if (deductionTypes.includes(type)) {
    return '-';
  }
  
  if (type === PettyCashTransactionType.TRANSFER && !isTransferReceived) {
    return '-';
  }
  
  return '+';
}