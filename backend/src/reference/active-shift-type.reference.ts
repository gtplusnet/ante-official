import { ActiveShiftTypeResponse } from 'src/shared/response';
import { ActiveShiftType } from '@prisma/client';

const activeShiftTypeReference: ActiveShiftTypeResponse[] = [
  {
    key: ActiveShiftType.NONE,
    label: 'No Reference',
    color: '#9e9e9e', // grey
  },
  {
    key: ActiveShiftType.REGULAR_SHIFT,
    label: 'Regular Shift',
    color: '#000000', // black
  },
  {
    key: ActiveShiftType.MANUAL_SCHEDULE,
    label: 'Manual Schedule',
    color: '#ff9800', // orange
  },
  {
    key: ActiveShiftType.SCHEDULE_ADJUSTMENT,
    label: 'Schedule Adjustment',
    color: '#f44336', // red - highest priority
  },
  {
    key: ActiveShiftType.INDIVIDUAL_SCHEDULE,
    label: 'Individual Schedule',
    color: '#9c27b0', // purple - high priority
  },
  {
    key: ActiveShiftType.TEAM_SCHEDULE,
    label: 'Team Schedule',
    color: '#4caf50', // green - medium priority
  },
];

export default activeShiftTypeReference;
