import { DeductionTypeReferenceResponse } from 'src/shared/response/payroll-group.response';

const salaryRateTypeReference: DeductionTypeReferenceResponse[] = [
  {
    key: 'BASED_ON_SALARY',
    label: 'Based on Salary',
  },
  {
    key: 'NOT_DEDUCTED',
    label: 'Not Deducted',
  },
  {
    key: 'CUSTOM',
    label: 'Custom',
  },
];

export default salaryRateTypeReference;
