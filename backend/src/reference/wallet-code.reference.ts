import { FundTransactionCode } from '@prisma/client';
import { WalletCodeReferenceResponse } from 'src/shared/response/wallet.response';

const walletCodeReference: WalletCodeReferenceResponse[] = [
  {
    key: FundTransactionCode.BEGINNING_BALANCE,
    label: 'Beginning Balance',
  },
  {
    key: FundTransactionCode.MANUAL_ADD,
    label: 'Manually Added',
  },
  {
    key: FundTransactionCode.MANUAL_DEDUCT,
    label: 'Manually Deducted',
  },
  {
    key: FundTransactionCode.FUND_TRANSFER_FROM,
    label: 'Transfer to another Account',
  },
  {
    key: FundTransactionCode.FUND_TRANSFER_TO,
    label: 'Received from another Account',
  },
  {
    key: FundTransactionCode.TRANSACTION_FEE,
    label: 'Transaction Fee',
  },
  {
    key: FundTransactionCode.PURCHASE_ORDER_PAYMENT,
    label: 'Purchase Order Payment',
  },
  {
    key: FundTransactionCode.RFP,
    label: 'Request for Payment',
  },
  {
    key: FundTransactionCode.RFP_RELEASED,
    label: 'Request for Payment Release',
  },
  {
    key: FundTransactionCode.COLLECTION,
    label: 'Collected Payment from Client',
  },
  {
    key: FundTransactionCode.INITIAL_LOAN_BALANCE,
    label: 'Initial Loan Balance',
  },
  {
    key: FundTransactionCode.ADD_LOAN_BALANCE,
    label: 'Add Loan Balance',
  },
  {
    key: FundTransactionCode.SUBTRACT_LOAN_BALANCE,
    label: 'Subtract Loan Balance',
  },
  {
    key: FundTransactionCode.PETTY_CASH_ASSIGNMENT,
    label: 'Petty Cash Assignment',
  },
  {
    key: FundTransactionCode.PETTY_CASH_REFILL,
    label: 'Petty Cash Refill',
  },
];

export default walletCodeReference;
