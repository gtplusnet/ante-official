import { CutoffType } from '@prisma/client';
import { CutoffTypeReferenceResponse } from '../shared/response/cutoff.response';

export const CutoffTypeReference: CutoffTypeReferenceResponse[] = [
  {
    key: CutoffType.WEEKLY,
    divisor: 4,
    label: 'Weekly',
  },
  {
    key: CutoffType.SEMIMONTHLY,
    divisor: 2,
    label: 'Semi-Monthly',
  },
  {
    key: CutoffType.MONTHLY,
    divisor: 1,
    label: 'Monthly',
  },
];

export const CutoffConfigSelectMonthly = {
  cutoffPeriod: [
    { key: 1, label: '1st' },
    { key: 2, label: '2nd' },
    { key: 3, label: '3rd' },
    { key: 4, label: '4th' },
    { key: 5, label: '5th' },
    { key: 6, label: '6th' },
    { key: 7, label: '7th' },
    { key: 8, label: '8th' },
    { key: 9, label: '9th' },
    { key: 10, label: '10th' },
    { key: 11, label: '11th' },
    { key: 12, label: '12th' },
    { key: 13, label: '13th' },
    { key: 14, label: '14th' },
    { key: 15, label: '15th' },
    { key: 16, label: '16th' },
    { key: 17, label: '17th' },
    { key: 18, label: '18th' },
    { key: 19, label: '19th' },
    { key: 20, label: '20th' },
    { key: 21, label: '21st' },
    { key: 22, label: '22nd' },
    { key: 23, label: '23rd' },
    { key: 24, label: '24th' },
    { key: 25, label: '25th' },
    { key: 26, label: '26th' },
    { key: 27, label: '27th' },
    { key: 28, label: '28th' },
  ],
};

export const CutoffConfigSelectSemiMonthly = {
  firstCutoffPeriod: [
    { key: 1, label: '1st' },
    { key: 2, label: '2nd' },
    { key: 3, label: '3rd' },
    { key: 4, label: '4th' },
    { key: 5, label: '5th' },
    { key: 6, label: '6th' },
    { key: 7, label: '7th' },
    { key: 8, label: '8th' },
    { key: 9, label: '9th' },
    { key: 10, label: '10th' },
    { key: 11, label: '11th' },
    { key: 12, label: '12th' },
    { key: 13, label: '13th' },
    { key: 14, label: '14th' },
    { key: 15, label: '15th' },
  ],
  lastCutoffPeriod: [
    { key: 16, label: '16th' },
    { key: 17, label: '17th' },
    { key: 18, label: '18th' },
    { key: 19, label: '19th' },
    { key: 20, label: '20th' },
    { key: 21, label: '21st' },
    { key: 22, label: '22nd' },
    { key: 23, label: '23rd' },
    { key: 24, label: '24th' },
    { key: 25, label: '25th' },
    { key: 26, label: '26th' },
    { key: 27, label: '27th' },
    { key: 28, label: '28th' },
  ],
};

export const CutoffConfigSelectWeekly = {
  cutoffDay: [
    { key: 'MONDAY', label: 'Monday' },
    { key: 'TUESDAY', label: 'Tuesday' },
    { key: 'WEDNESDAY', label: 'Wednesday' },
    { key: 'THURSDAY', label: 'Thursday' },
    { key: 'FRIDAY', label: 'Friday' },
    { key: 'SATURDAY', label: 'Saturday' },
    { key: 'SUNDAY', label: 'Sunday' },
  ],
};
