import { TimekeepingLogTypeInterface } from 'src/shared/response';
import { TimekeepingLogType } from 'src/shared/enums/timekeeping-log-types.enums';

const deductionTimeBasis: TimekeepingLogTypeInterface[] = [
  {
    key: TimekeepingLogType.DEFAULT,
    label: 'Default',
  },
  {
    key: TimekeepingLogType.NO_LOG,
    label: 'No Log',
  },
];

export default deductionTimeBasis;
