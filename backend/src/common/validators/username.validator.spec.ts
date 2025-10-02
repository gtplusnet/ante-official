import { validate } from 'class-validator';
import { ValidUsername } from './username.validator';

class TestClass {
  @ValidUsername()
  username: string;
}

describe('ValidUsername Validator', () => {
  let testInstance: TestClass;

  beforeEach(() => {
    testInstance = new TestClass();
  });

  describe('Valid usernames', () => {
    it('should allow usernames with only letters', async () => {
      testInstance.username = 'johndoe';
      const errors = await validate(testInstance);
      expect(errors.length).toBe(0);
    });

    it('should allow usernames with only numbers', async () => {
      testInstance.username = '123456';
      const errors = await validate(testInstance);
      expect(errors.length).toBe(0);
    });

    it('should allow usernames with letters and numbers', async () => {
      testInstance.username = 'john123';
      const errors = await validate(testInstance);
      expect(errors.length).toBe(0);
    });

    it('should allow usernames with special characters', async () => {
      testInstance.username = 'john_doe';
      const errors = await validate(testInstance);
      expect(errors.length).toBe(0);
    });

    it('should allow usernames with dots', async () => {
      testInstance.username = 'john.doe';
      const errors = await validate(testInstance);
      expect(errors.length).toBe(0);
    });

    it('should allow usernames with hyphens', async () => {
      testInstance.username = 'john-doe';
      const errors = await validate(testInstance);
      expect(errors.length).toBe(0);
    });

    it('should allow usernames with mixed special characters', async () => {
      testInstance.username = 'john_doe-123.test';
      const errors = await validate(testInstance);
      expect(errors.length).toBe(0);
    });

    it('should allow usernames with symbols', async () => {
      testInstance.username = 'john@doe!#$%';
      const errors = await validate(testInstance);
      expect(errors.length).toBe(0);
    });
  });

  describe('Invalid usernames', () => {
    it('should not allow usernames with spaces', async () => {
      testInstance.username = 'john doe';
      const errors = await validate(testInstance);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints?.validUsername).toBe(
        'Username must not contain spaces.',
      );
    });

    it('should not allow usernames with multiple spaces', async () => {
      testInstance.username = 'john   doe   123';
      const errors = await validate(testInstance);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints?.validUsername).toBe(
        'Username must not contain spaces.',
      );
    });

    it('should not allow usernames with leading spaces', async () => {
      testInstance.username = ' johndoe';
      const errors = await validate(testInstance);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints?.validUsername).toBe(
        'Username must not contain spaces.',
      );
    });

    it('should not allow usernames with trailing spaces', async () => {
      testInstance.username = 'johndoe ';
      const errors = await validate(testInstance);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints?.validUsername).toBe(
        'Username must not contain spaces.',
      );
    });

    it('should not allow empty usernames', async () => {
      testInstance.username = '';
      const errors = await validate(testInstance);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints?.validUsername).toBe(
        'Username must not contain spaces.',
      );
    });

    it('should not allow null usernames', async () => {
      testInstance.username = null as any;
      const errors = await validate(testInstance);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints?.validUsername).toBe(
        'Username must not contain spaces.',
      );
    });

    it('should not allow undefined usernames', async () => {
      testInstance.username = undefined as any;
      const errors = await validate(testInstance);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints?.validUsername).toBe(
        'Username must not contain spaces.',
      );
    });
  });
});
