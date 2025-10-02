import { IS_PUBLIC_KEY, Public } from './public.decorator';

describe('Public Decorator', () => {
  describe('IS_PUBLIC_KEY', () => {
    it('should have correct value', () => {
      expect(IS_PUBLIC_KEY).toBe('isPublic');
    });

    it('should be a string constant', () => {
      expect(typeof IS_PUBLIC_KEY).toBe('string');
    });
  });

  describe('Public', () => {
    it('should return a function', () => {
      const decorator = Public();
      expect(typeof decorator).toBe('function');
    });

    it('should create different instances', () => {
      const decorator1 = Public();
      const decorator2 = Public();

      expect(decorator1).toBeDefined();
      expect(decorator2).toBeDefined();
      // Both should be functions, but they're decorators created by SetMetadata
      expect(typeof decorator1).toBe('function');
      expect(typeof decorator2).toBe('function');
    });

    it('should not throw when called', () => {
      expect(() => Public()).not.toThrow();
    });

    it('should create a decorator that is defined', () => {
      const decorator = Public();

      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });
  });
});
