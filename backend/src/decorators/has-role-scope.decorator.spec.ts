import { RequiredRoleScope } from './has-role-scope.decorator';

describe('RequiredRoleScope Decorator', () => {
  describe('RequiredRoleScope', () => {
    it('should return a function', () => {
      const decorator = RequiredRoleScope('admin');
      expect(typeof decorator).toBe('function');
    });

    it('should work with different role scopes', () => {
      const adminDecorator = RequiredRoleScope('admin');
      const userDecorator = RequiredRoleScope('user');
      const managerDecorator = RequiredRoleScope('manager');

      expect(typeof adminDecorator).toBe('function');
      expect(typeof userDecorator).toBe('function');
      expect(typeof managerDecorator).toBe('function');
    });

    it('should handle empty string role scope', () => {
      const decorator = RequiredRoleScope('');
      expect(typeof decorator).toBe('function');
    });

    it('should not throw when called', () => {
      expect(() => RequiredRoleScope('admin')).not.toThrow();
      expect(() => RequiredRoleScope('user')).not.toThrow();
      expect(() => RequiredRoleScope('')).not.toThrow();
    });

    it('should create a decorator that is defined', () => {
      const decorator = RequiredRoleScope('admin');

      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });

    it('should handle special characters in role scope', () => {
      const specialRoleScopes = [
        'admin-level-1',
        'user.read.write',
        'role:manager',
        'super_admin',
        '123numeric',
      ];

      specialRoleScopes.forEach((roleScope) => {
        const decorator = RequiredRoleScope(roleScope);
        expect(typeof decorator).toBe('function');
        expect(decorator).toBeDefined();
      });
    });

    it('should handle long role scope names', () => {
      const longRoleScope =
        'very-long-role-scope-name-with-many-parts-and-descriptive-text';
      const decorator = RequiredRoleScope(longRoleScope);

      expect(typeof decorator).toBe('function');
      expect(decorator).toBeDefined();
    });
  });
});
