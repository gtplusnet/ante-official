import { BreakdownTypeReferenceResponse } from 'src/shared/response/timekeeping.response';
import { BreakdownType } from '@prisma/client';

const list: BreakdownTypeReferenceResponse[] = [
  {
    key: BreakdownType.LATE,
    isDefaultApproved: true,
    label: 'Late',
  },
  {
    key: BreakdownType.OVERTIME,
    isDefaultApproved: false,
    label: 'Overtime',
  },
  {
    key: BreakdownType.WORK_TIME,
    isDefaultApproved: true,
    label: 'Work Time',
  },
  {
    key: BreakdownType.NIGHT_DIFFERENTIAL,
    isDefaultApproved: true,
    label: 'Night Differential / Work Time',
  },
  {
    key: BreakdownType.NIGHT_DIFFERENTIAL_OVERTIME,
    isDefaultApproved: false,
    label: 'Night Differential / Overtime',
  },
  {
    key: BreakdownType.UNDERTIME,
    isDefaultApproved: false,
    label: 'Under Time',
  },
  {
    key: BreakdownType.BREAK_TIME,
    isDefaultApproved: false,
    label: 'Break Time',
  },
];

export default list;
