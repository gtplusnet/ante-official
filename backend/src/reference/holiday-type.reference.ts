import { HolidayTypeResponse } from 'src/shared/response';
import { HolidayType } from '@prisma/client';

const holidayType: HolidayTypeResponse[] = [
  {
    key: HolidayType.SPECIAL,
    label: 'Special Holiday',
  },
  {
    key: HolidayType.REGULAR,
    label: 'Regular Holiday',
  },
];

export default holidayType;
