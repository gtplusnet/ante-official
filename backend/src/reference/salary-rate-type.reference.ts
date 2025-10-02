import { SalaryRateTypeReferenceResponse } from 'src/shared/response/payroll-group.response';

const salaryRateTypeReference: SalaryRateTypeReferenceResponse[] = [
  {
    key: 'MONTHLY_RATE',
    label: 'Monthly Rate',
  },
  {
    key: 'DAILY_RATE',
    label: 'Daily Rate',
  },
  {
    key: 'FIXED_RATE',
    label: 'Fixed Rate',
  },
];

export default salaryRateTypeReference;
