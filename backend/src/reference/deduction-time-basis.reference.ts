import { DeductionTimeBasisResponse } from 'src/shared/response/payroll-group.response';
import { DeductionTimeBasis } from 'src/shared/enums/deduction-time-basis.enum';

const deductionTimeBasis: DeductionTimeBasisResponse[] = [
  {
    key: DeductionTimeBasis.PER_MINUTE,
    label: 'Per minute',
  },
  {
    key: DeductionTimeBasis.PER_HOUR,
    label: 'Per hour',
  },
];

export default deductionTimeBasis;
