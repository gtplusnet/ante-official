import { faker } from '@faker-js/faker';

export interface TestStudent {
  studentNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  contactNumber: string;
  dateOfBirth: string;
  address?: string;
  lrn?: string;
  username?: string;
  password?: string;
}

export interface TestGuardian {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  contactNumber: string;
  alternateNumber?: string;
  address?: string;
  occupation?: string;
  dateOfBirth?: string;
  relationship?: string;
  username?: string;
  password?: string;
}

export interface TestStudentGuardianRelation {
  student: TestStudent;
  guardian: TestGuardian;
  relationship: string;
  isPrimary: boolean;
}

export interface TestScanData {
  personId: string;
  personType: 'student' | 'guardian';
  scanTime: Date;
  location?: string;
}

// Multi-app authentication interfaces
export interface AppAuthConfig {
  baseUrl: string;
  loginPath: string;
  dashboardPath: string;
  credentials: {
    username: string;
    password: string;
  };
  authType: 'token' | 'session';
}

export const APP_CONFIGS: Record<string, AppAuthConfig> = {
  FRONTEND_MAIN: {
    baseUrl: 'http://localhost:9000',
    loginPath: '/#/',
    dashboardPath: '/#/member/dashboard',
    credentials: {
      username: 'guillermotabligan',
      password: 'water123'
    },
    authType: 'token'
  },
  GUARDIAN_APP: {
    baseUrl: 'http://localhost:9003',
    loginPath: '/login',
    dashboardPath: '/dashboard',
    credentials: {
      username: '', // Will be set dynamically with test guardian
      password: 'TestPassword123!'
    },
    authType: 'session'
  },
  GATE_APP: {
    baseUrl: 'http://localhost:9002',
    loginPath: '/',
    dashboardPath: '/scan',
    credentials: {
      username: 'device-license-key',
      password: 'license-validation'
    },
    authType: 'session'
  }
};

// Test data generators using faker
export class StudentTestDataGenerator {
  static generateStudent(overrides?: Partial<TestStudent>): TestStudent {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const birthDate = faker.date.birthdate({ min: 5, max: 18, mode: 'age' });
    
    return {
      studentNumber: faker.string.numeric(10),
      firstName,
      lastName,
      middleName: faker.person.middleName(),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      contactNumber: faker.phone.number('09#########'),
      dateOfBirth: birthDate.toISOString().split('T')[0],
      address: faker.location.streetAddress({ useFullAddress: true }),
      lrn: faker.string.numeric(12),
      username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${faker.string.numeric(3)}`,
      password: 'TestPassword123!',
      ...overrides
    };
  }

  static generateGuardian(overrides?: Partial<TestGuardian>): TestGuardian {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const birthDate = faker.date.birthdate({ min: 25, max: 60, mode: 'age' });
    
    return {
      firstName,
      lastName,
      middleName: faker.person.middleName(),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      contactNumber: faker.phone.number('09#########'),
      alternateNumber: faker.phone.number('09#########'),
      address: faker.location.streetAddress({ useFullAddress: true }),
      occupation: faker.person.jobTitle(),
      dateOfBirth: birthDate.toISOString().split('T')[0],
      relationship: faker.helpers.arrayElement(['Mother', 'Father', 'Guardian', 'Aunt', 'Uncle', 'Grandmother', 'Grandfather']),
      username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${faker.string.numeric(3)}`,
      password: 'TestPassword123!',
      ...overrides
    };
  }

  static generateStudentGuardianRelation(
    studentOverrides?: Partial<TestStudent>,
    guardianOverrides?: Partial<TestGuardian>
  ): TestStudentGuardianRelation {
    const student = this.generateStudent(studentOverrides);
    const guardian = this.generateGuardian(guardianOverrides);
    
    // Make sure guardian has same last name if they're a parent
    if (guardian.relationship === 'Mother' || guardian.relationship === 'Father') {
      guardian.lastName = student.lastName;
    }

    return {
      student,
      guardian,
      relationship: guardian.relationship || 'Guardian',
      isPrimary: faker.datatype.boolean()
    };
  }

  static generateMultipleStudents(count: number): TestStudent[] {
    return Array.from({ length: count }, () => this.generateStudent());
  }

  static generateMultipleGuardians(count: number): TestGuardian[] {
    return Array.from({ length: count }, () => this.generateGuardian());
  }

  static generateScanData(personId: string, personType: 'student' | 'guardian'): TestScanData {
    return {
      personId,
      personType,
      scanTime: new Date(),
      location: faker.helpers.arrayElement(['Main Gate', 'Back Gate', 'Admin Building'])
    };
  }
}

// Pre-defined test datasets for consistent testing
export const TEST_STUDENTS: Record<string, TestStudent> = {
  DEFAULT: StudentTestDataGenerator.generateStudent({
    studentNumber: 'STU001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe.test@example.com'
  }),
  SECONDARY: StudentTestDataGenerator.generateStudent({
    studentNumber: 'STU002', 
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith.test@example.com'
  })
};

export const TEST_GUARDIANS: Record<string, TestGuardian> = {
  DEFAULT: StudentTestDataGenerator.generateGuardian({
    firstName: 'Mary',
    lastName: 'Doe',
    email: 'mary.doe.test@example.com',
    relationship: 'Mother'
  }),
  SECONDARY: StudentTestDataGenerator.generateGuardian({
    firstName: 'Robert',
    lastName: 'Smith', 
    email: 'robert.smith.test@example.com',
    relationship: 'Father'
  })
};

// Helper functions
export function getTestStudent(studentType: keyof typeof TEST_STUDENTS = 'DEFAULT'): TestStudent {
  const student = { ...TEST_STUDENTS[studentType] };
  // Add unique timestamp to prevent conflicts
  student.studentNumber = `${student.studentNumber}_${Date.now()}`;
  student.email = `test_${Date.now()}_${student.email}`;
  return student;
}

export function getTestGuardian(guardianType: keyof typeof TEST_GUARDIANS = 'DEFAULT'): TestGuardian {
  const guardian = { ...TEST_GUARDIANS[guardianType] };
  // Add unique timestamp to prevent conflicts
  guardian.email = `test_${Date.now()}_${guardian.email}`;
  return guardian;
}

export function getTestStudentGuardianRelation(): TestStudentGuardianRelation {
  return StudentTestDataGenerator.generateStudentGuardianRelation();
}

// Cleanup helpers
export function generateCleanupData() {
  return {
    testEmailPrefix: `test_${Date.now()}`,
    testStudentPrefix: `STU_${Date.now()}`,
    cleanupTimestamp: Date.now()
  };
}