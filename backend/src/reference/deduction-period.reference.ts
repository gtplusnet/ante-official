import { DeductionPeriodReferenceResponse } from '../shared/response/payroll-group.response';

const salaryRateTypeReference: DeductionPeriodReferenceResponse[] = [
  {
    key: 'FIRST_PERIOD',
    label: 'First Period',
  },
  {
    key: 'LAST_PERIOD',
    label: 'Last Period',
  },
  {
    key: 'EVERY_PERIOD',
    label: 'Every Period',
  },
  {
    key: 'NOT_DEDUCTED',
    label: 'No Deduction',
  },
];

export default salaryRateTypeReference;
