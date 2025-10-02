import { EmploymentStatus } from '@prisma/client';

const employmentStatusReference = [
  { key: EmploymentStatus.REGULAR, label: 'Regular' },
  { key: EmploymentStatus.CONTRACTTUAL, label: 'Contractual' },
  { key: EmploymentStatus.PROBATIONARY, label: 'Probationary' },
  { key: EmploymentStatus.TRAINEE, label: 'Trainee' },
];

export default employmentStatusReference;
