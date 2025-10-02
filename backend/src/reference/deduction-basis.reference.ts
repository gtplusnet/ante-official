import { DeductionBasisReferenceReponse } from '../shared/response/payroll-group.response';

const salaryRateTypeReference: DeductionBasisReferenceReponse[] = [
  {
    key: 'BASIC_SALARY',
    label: 'Monthly Rate',
  },
  {
    key: 'BASIC_PAY',
    label: 'Basic Pay',
  },
  {
    key: 'PRO_RATED_BASIC_PAY',
    label: 'Pro Rated Basic Pay',
  },
  {
    key: 'GROSS_PAY',
    label: 'Gross Pay',
  },
];

export default salaryRateTypeReference;
