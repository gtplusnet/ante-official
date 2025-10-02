import { EmployeeDocumentCategory } from '@prisma/client';

export interface DocumentTypeReference {
  category: EmployeeDocumentCategory;
  types: string[];
}

const employeeDocumentTypes: DocumentTypeReference[] = [
  {
    category: EmployeeDocumentCategory.EMPLOYMENT,
    types: [
      'Employment Contract',
      'Job Offer Letter',
      'Non-Disclosure Agreement (NDA)',
      'Non-Compete Agreement',
      'Probationary Evaluation',
      'Regularization Letter',
      'Appointment Letter',
      'Confirmation Letter',
    ],
  },
  {
    category: EmployeeDocumentCategory.GOVERNMENT_LEGAL,
    types: [
      'Birth Certificate',
      "Valid ID - Driver's License",
      'Valid ID - Passport',
      'Valid ID - National ID',
      "Valid ID - Voter's ID",
      'Valid ID - Other',
      'TIN ID/Certificate',
      'SSS E1 Form',
      'PhilHealth MDR',
      'Pag-IBIG MID',
      'Marriage Certificate',
      'Dependent Birth Certificate',
      'Police Clearance',
      'NBI Clearance',
      'Barangay Clearance',
    ],
  },
  {
    category: EmployeeDocumentCategory.EDUCATION_PROFESSIONAL,
    types: [
      'Diploma/Degree Certificate',
      'Transcript of Records',
      'Professional License',
      'Board Certificate',
      'Training Certificate',
      'Seminar Certificate',
      'Workshop Certificate',
      'Certification',
      'Course Completion',
    ],
  },
  {
    category: EmployeeDocumentCategory.MEDICAL_HEALTH,
    types: [
      'Pre-Employment Medical Certificate',
      'Annual Physical Exam',
      'Drug Test Result',
      'Chest X-Ray Result',
      'Laboratory Results',
      'Vaccination Record',
      'COVID-19 Vaccination Card',
      'Health Insurance Card',
      'Medical History',
      'Fit to Work Certificate',
    ],
  },
  {
    category: EmployeeDocumentCategory.PERFORMANCE_DISCIPLINARY,
    types: [
      'Performance Evaluation',
      'Warning Letter',
      'Memorandum',
      'Suspension Notice',
      'Commendation Letter',
      'Award Certificate',
      'Recognition Letter',
      'Incident Report',
      'Promotion Letter',
      'Transfer Letter',
      'Demotion Letter',
    ],
  },
  {
    category: EmployeeDocumentCategory.COMPENSATION_BENEFITS,
    types: [
      'Salary History',
      'Loan Application',
      'Loan Agreement',
      'Insurance Enrollment Form',
      'HMO Enrollment Form',
      'Benefit Claim Form',
      'Leave Application',
      'Overtime Authorization',
      'Salary Adjustment Letter',
      'Bonus Letter',
    ],
  },
  {
    category: EmployeeDocumentCategory.EXIT_DOCUMENTS,
    types: [
      'Resignation Letter',
      'Exit Interview Form',
      'Clearance Form',
      'Certificate of Employment',
      'Quitclaim',
      'Final Pay Computation',
      'Return of Company Property',
      'Recommendation Letter',
    ],
  },
  {
    category: EmployeeDocumentCategory.OTHER,
    types: [
      'Other Document',
      'Miscellaneous',
      'Emergency Contact Form',
      'Employee Information Sheet',
      'Bank Account Form',
      'Character Reference',
    ],
  },
];

export default employeeDocumentTypes;

export function getDocumentTypesByCategory(
  category: EmployeeDocumentCategory,
): string[] {
  const categoryData = employeeDocumentTypes.find(
    (doc) => doc.category === category,
  );
  return categoryData ? categoryData.types : [];
}

export function getAllDocumentTypes(): string[] {
  return employeeDocumentTypes.flatMap((doc) => doc.types);
}
