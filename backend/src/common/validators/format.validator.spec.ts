import { ValidFormatConstraint } from './format.validator';

describe('ValidFormatConstraint', () => {
  let validator: ValidFormatConstraint;

  beforeEach(() => {
    validator = new ValidFormatConstraint();
  });

  describe('validate', () => {
    it('should return true for valid lowercase letters', () => {
      expect(validator.validate('abc')).toBe(true);
      expect(validator.validate('hello')).toBe(true);
      expect(validator.validate('lowercase')).toBe(true);
    });

    it('should return true for lowercase letters with dots', () => {
      expect(validator.validate('a.b')).toBe(true);
      expect(validator.validate('hello.world')).toBe(true);
      expect(validator.validate('test.example.com')).toBe(true);
      expect(validator.validate('a.b.c.d')).toBe(true);
    });

    it('should return true for strings containing only dots', () => {
      expect(validator.validate('.')).toBe(true);
      expect(validator.validate('..')).toBe(true);
      expect(validator.validate('...')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(validator.validate('')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(validator.validate(null as any)).toBe(false);
      expect(validator.validate(undefined as any)).toBe(false);
    });

    it('should return false for strings with uppercase letters', () => {
      expect(validator.validate('ABC')).toBe(false);
      expect(validator.validate('Hello')).toBe(false);
      expect(validator.validate('test.Example')).toBe(false);
      expect(validator.validate('A.b.c')).toBe(false);
    });

    it('should return false for strings with numbers', () => {
      expect(validator.validate('abc123')).toBe(false);
      expect(validator.validate('test123')).toBe(false);
      expect(validator.validate('1abc')).toBe(false);
      expect(validator.validate('a1b')).toBe(false);
      expect(validator.validate('123')).toBe(false);
    });

    it('should return false for strings with spaces', () => {
      expect(validator.validate('hello world')).toBe(false);
      expect(validator.validate('a b')).toBe(false);
      expect(validator.validate(' abc')).toBe(false);
      expect(validator.validate('abc ')).toBe(false);
      expect(validator.validate(' ')).toBe(false);
    });

    it('should return false for strings with special characters', () => {
      expect(validator.validate('hello@world')).toBe(false);
      expect(validator.validate('test#example')).toBe(false);
      expect(validator.validate('a-b')).toBe(false);
      expect(validator.validate('a_b')).toBe(false);
      expect(validator.validate('a+b')).toBe(false);
      expect(validator.validate('a=b')).toBe(false);
      expect(validator.validate('a!b')).toBe(false);
    });

    it('should return false for strings with mixed invalid characters', () => {
      expect(validator.validate('Hello World!')).toBe(false);
      expect(validator.validate('test123@example.com')).toBe(false);
      expect(validator.validate('a.B.c')).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('should return the correct error message', () => {
      const message = validator.defaultMessage();
      expect(message).toBe(
        'Value must contain only lowercase letters and dots, with no spaces or other symbols.',
      );
    });
  });
});
