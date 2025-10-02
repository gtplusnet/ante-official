import { DeductionCategoryDataResponse } from '../shared/response/deduction-configuration.response';
import { DeductionCategory } from '@prisma/client';

export const DeductionCategoryReference: DeductionCategoryDataResponse[] = [
  {
    key: DeductionCategory.LOAN,
    value: 'Loan',
    hasTotalAmount: true,
  },
  {
    key: DeductionCategory.DEDUCTION,
    value: 'Deduction',
    hasTotalAmount: false,
  },
];
