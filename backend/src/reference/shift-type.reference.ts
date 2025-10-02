import { ShiftTypeResponse } from 'src/shared/response';
import { ShiftType } from '@prisma/client';

const shiftTypeReference: ShiftTypeResponse[] = [
  {
    key: ShiftType.REST_DAY,
    label: 'Rest Day',
    isWorkDay: false,
  },
  {
    key: ShiftType.EXTRA_DAY,
    label: 'Extra Day',
    isWorkDay: true,
  },
  {
    key: ShiftType.FLEXITIME,
    label: 'Flexitime',
    isWorkDay: true,
  },
  {
    key: ShiftType.TIME_BOUND,
    label: 'Time Bound',
    isWorkDay: true,
  },
];

export default shiftTypeReference;
