import { TimekeepingSourceResponse } from 'src/shared/response';
import { TimekeepingSource } from '@prisma/client';

const timekeepingSourceResponse: TimekeepingSourceResponse[] = [
  {
    key: TimekeepingSource.MANUAL,
    label: 'Manual',
  },
  {
    key: TimekeepingSource.BIOMETRICS,
    label: 'Biometrics',
  },
  {
    key: TimekeepingSource.SYSTEM,
    label: 'System',
  },
  {
    key: TimekeepingSource.CERTIFICATE_OF_ATTENDANCE,
    label: 'Certificate of Attendance',
  },
  {
    key: TimekeepingSource.OFFICIAL_BUSINESS,
    label: 'Official Business',
  },
  {
    key: TimekeepingSource.EXCEL_IMPORTATION,
    label: 'Excel Importation',
  },
];

export default timekeepingSourceResponse;
