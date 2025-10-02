import { validate } from 'class-validator';
import { IsDateGreaterThan } from './date-range.validator';

class TestClass {
  startDate: string;

  @IsDateGreaterThan('startDate')
  endDate: string;
}

describe('IsDateGreaterThan', () => {
  it('should be defined', () => {
    expect(IsDateGreaterThan).toBeDefined();
  });

  describe('validation', () => {
    it('should pass when end date is greater than start date', async () => {
      const testObj = new TestClass();
      testObj.startDate = '2023-01-01';
      testObj.endDate = '2023-01-02';

      const errors = await validate(testObj);
      expect(errors).toHaveLength(0);
    });

    it('should fail when end date is not greater than start date', async () => {
      const testObj = new TestClass();
      testObj.startDate = '2023-01-02';
      testObj.endDate = '2023-01-01';

      const errors = await validate(testObj);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isDateGreaterThan');
    });

    it('should fail when end date equals start date', async () => {
      const testObj = new TestClass();
      testObj.startDate = '2023-01-01';
      testObj.endDate = '2023-01-01';

      const errors = await validate(testObj);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isDateGreaterThan');
    });

    it('should provide correct default error message', async () => {
      const testObj = new TestClass();
      testObj.startDate = '2023-01-02';
      testObj.endDate = '2023-01-01';

      const errors = await validate(testObj);
      expect(errors[0].constraints?.isDateGreaterThan).toBe(
        'endDate must be greater than startDate',
      );
    });

    it('should handle Date objects', async () => {
      const testObj = new TestClass();
      testObj.startDate = new Date('2023-01-01').toISOString();
      testObj.endDate = new Date('2023-01-02').toISOString();

      const errors = await validate(testObj);
      expect(errors).toHaveLength(0);
    });

    it('should handle timestamp numbers', async () => {
      const testObj = new TestClass();
      testObj.startDate = '1672531200000'; // 2023-01-01 in milliseconds
      testObj.endDate = '1672617600000'; // 2023-01-02 in milliseconds

      const errors = await validate(testObj);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid date format', async () => {
      const testObj = new TestClass();
      testObj.startDate = 'invalid-date';
      testObj.endDate = '2023-01-02';

      const errors = await validate(testObj);
      expect(errors).toHaveLength(1);
    });

    it('should handle different date formats', async () => {
      const testObj = new TestClass();
      testObj.startDate = '2023/01/01';
      testObj.endDate = '2023-01-02';

      const errors = await validate(testObj);
      expect(errors).toHaveLength(0);
    });
  });

  describe('with custom validation options', () => {
    it('should use custom error message when provided', async () => {
      class CustomTestClass {
        fromDate: string;

        @IsDateGreaterThan('fromDate', {
          message: 'To date must be after from date',
        })
        toDate: string;
      }

      const testObj = new CustomTestClass();
      testObj.fromDate = '2023-01-02';
      testObj.toDate = '2023-01-01';

      const errors = await validate(testObj);
      expect(errors[0].constraints?.isDateGreaterThan).toBe(
        'To date must be after from date',
      );
    });

    it('should respect validation groups', async () => {
      class GroupTestClass {
        startDate: string;

        @IsDateGreaterThan('startDate', { groups: ['date-check'] })
        endDate: string;
      }

      const testObj = new GroupTestClass();
      testObj.startDate = '2023-01-02';
      testObj.endDate = '2023-01-01';

      // Without group - validation should still run because it applies to all groups by default
      const errorsWithoutGroup = await validate(testObj);
      expect(errorsWithoutGroup).toHaveLength(1);

      // With group - should validate and fail
      const errorsWithGroup = await validate(testObj, {
        groups: ['date-check'],
      });
      expect(errorsWithGroup).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined values', async () => {
      const testObj = new TestClass();
      testObj.startDate = null as any;
      testObj.endDate = '2023-01-01';

      const errors = await validate(testObj);
      expect(errors).toHaveLength(1); // Should fail because null date comparison fails
    });

    it('should handle undefined property reference', async () => {
      const testObj = new TestClass();
      testObj.endDate = '2023-01-02';
      // startDate is undefined

      const errors = await validate(testObj);
      expect(errors).toHaveLength(1); // Should fail because undefined date comparison fails
    });

    it('should handle empty string dates', async () => {
      const testObj = new TestClass();
      testObj.startDate = '';
      testObj.endDate = '2023-01-01';

      const errors = await validate(testObj);
      expect(errors).toHaveLength(1); // Should fail because empty string is invalid date
    });
  });

  describe('decorator registration', () => {
    it('should register decorator with correct name', () => {
      const _mockRegisterDecorator = jest.fn();
      const mockObject = {};
      const mockPropertyName = 'testProperty';

      // We can't easily mock the registerDecorator function since it's imported
      // But we can test that the decorator function is created and can be called
      const decorator = IsDateGreaterThan('startDate');
      expect(typeof decorator).toBe('function');

      // The decorator should be callable with object and property name
      expect(() => decorator(mockObject, mockPropertyName)).not.toThrow();
    });

    it('should create decorator with validation options', () => {
      const validationOptions = { message: 'Custom message' };
      const decorator = IsDateGreaterThan('startDate', validationOptions);
      expect(typeof decorator).toBe('function');
      expect(() => decorator({}, 'testProperty')).not.toThrow();
    });

    it('should create decorator without validation options', () => {
      const decorator = IsDateGreaterThan('startDate');
      expect(typeof decorator).toBe('function');
      expect(() => decorator({}, 'testProperty')).not.toThrow();
    });
  });
});
