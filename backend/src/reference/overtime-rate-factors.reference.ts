import { OvertimeRateFactors } from '@modules/hr/configuration/payroll-group-configuration/payroll-group-configuration.interface';

const overtimeRateFactorsReference: OvertimeRateFactors = {
  workDay: {
    nonHoliday: {
      noOvertime: 0,
      withOvertime: 1.25,
      withNightDifferential: 0.1,
      withNightDifferentialAndOvertime: 1.375,
    },
    regularHoliday: {
      noOvertime: 1,
      withOvertime: 2.6,
      withNightDifferential: 1.2,
      withNightDifferentialAndOvertime: 2.86,
    },
    specialHoliday: {
      noOvertime: 0.3,
      withOvertime: 1.69,
      withNightDifferential: 0.43,
      withNightDifferentialAndOvertime: 1.859,
    },
    doubleHoliday: {
      noOvertime: 2,
      withOvertime: 3.9,
      withNightDifferential: 3.3,
      withNightDifferentialAndOvertime: 4.29,
    },
  },
  restDay: {
    nonHoliday: {
      noOvertime: 1.3,
      withOvertime: 1.69,
      withNightDifferential: 1.43,
      withNightDifferentialAndOvertime: 1.859,
    },
    regularHoliday: {
      noOvertime: 2.6,
      withOvertime: 3.38,
      withNightDifferential: 2.86,
      withNightDifferentialAndOvertime: 3.719,
    },
    specialHoliday: {
      noOvertime: 1.5,
      withOvertime: 1.95,
      withNightDifferential: 1.65,
      withNightDifferentialAndOvertime: 2.145,
    },
    doubleHoliday: {
      noOvertime: 3.9,
      withOvertime: 5.07,
      withNightDifferential: 4.29,
      withNightDifferentialAndOvertime: 5.577,
    },
  },
};
export default overtimeRateFactorsReference;
