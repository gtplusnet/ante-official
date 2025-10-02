import { CutoffPeriodType } from '@prisma/client';
import { CutoffPeriodTypeResponse } from '../shared/response';

const CutoffPeriodTypeReference: CutoffPeriodTypeResponse[] = [
  {
    key: CutoffPeriodType.FIRST_PERIOD,
    label: 'First Period',
  },
  {
    key: CutoffPeriodType.MIDDLE_PERIOD,
    label: 'Middle Period',
  },
  {
    key: CutoffPeriodType.LAST_PERIOD,
    label: 'Last Period',
  },
];

export default CutoffPeriodTypeReference;
