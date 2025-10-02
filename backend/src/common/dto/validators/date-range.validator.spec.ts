import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IsDateGreaterThan } from './date-range.validator';

class TestDateRangeDTO {
  startDate: string;

  @IsDateGreaterThan('startDate')
  endDate: string;
}

describe('IsDateGreaterThan Validator', () => {
  it('should pass when end date is greater than start date', async () => {
    const testData = {
      startDate: '2024-01-01',
      endDate: '2024-01-02',
    };

    const dto = plainToInstance(TestDateRangeDTO, testData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail when end date is less than start date', async () => {
    const testData = {
      startDate: '2024-01-02',
      endDate: '2024-01-01',
    };

    const dto = plainToInstance(TestDateRangeDTO, testData);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const endDateError = errors.find((error) => error.property === 'endDate');
    expect(endDateError).toBeDefined();
    expect(endDateError?.constraints?.isDateGreaterThan).toContain(
      'must be greater than startDate',
    );
  });

  it('should fail when end date is equal to start date', async () => {
    const testData = {
      startDate: '2024-01-01',
      endDate: '2024-01-01',
    };

    const dto = plainToInstance(TestDateRangeDTO, testData);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const endDateError = errors.find((error) => error.property === 'endDate');
    expect(endDateError).toBeDefined();
  });

  it('should work with different date formats', async () => {
    const testData = {
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-01-02T00:00:00.000Z',
    };

    const dto = plainToInstance(TestDateRangeDTO, testData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should handle datetime strings correctly', async () => {
    const testData = {
      startDate: '2024-01-01T10:00:00.000Z',
      endDate: '2024-01-01T11:00:00.000Z',
    };

    const dto = plainToInstance(TestDateRangeDTO, testData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail when datetime end is before datetime start', async () => {
    const testData = {
      startDate: '2024-01-01T11:00:00.000Z',
      endDate: '2024-01-01T10:00:00.000Z',
    };

    const dto = plainToInstance(TestDateRangeDTO, testData);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should handle different years correctly', async () => {
    const testData = {
      startDate: '2023-12-31',
      endDate: '2024-01-01',
    };

    const dto = plainToInstance(TestDateRangeDTO, testData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should provide correct error message with property names', async () => {
    const testData = {
      startDate: '2024-01-02',
      endDate: '2024-01-01',
    };

    const dto = plainToInstance(TestDateRangeDTO, testData);
    const errors = await validate(dto);

    const endDateError = errors.find((error) => error.property === 'endDate');
    expect(endDateError?.constraints?.isDateGreaterThan).toBe(
      'endDate must be greater than startDate',
    );
  });

  it('should handle edge case with millisecond differences', async () => {
    const testData = {
      startDate: '2024-01-01T10:00:00.000Z',
      endDate: '2024-01-01T10:00:00.001Z',
    };

    const dto = plainToInstance(TestDateRangeDTO, testData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should handle leap year dates', async () => {
    const testData = {
      startDate: '2024-02-28',
      endDate: '2024-02-29', // 2024 is a leap year
    };

    const dto = plainToInstance(TestDateRangeDTO, testData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
