import { AccountUpdatedEvent, RoleUpdatedEvent } from './account.events';

describe('Account Events', () => {
  describe('AccountUpdatedEvent', () => {
    it('should create an instance with all parameters', () => {
      const accountId = 'account123';
      const updateType = 'profile';
      const changedBy = 'self';
      const accountData = { name: 'John Doe', email: 'john@example.com' };

      const event = new AccountUpdatedEvent(
        accountId,
        updateType,
        changedBy,
        accountData,
      );

      expect(event.accountId).toBe(accountId);
      expect(event.updateType).toBe(updateType);
      expect(event.changedBy).toBe(changedBy);
      expect(event.accountData).toBe(accountData);
    });

    it('should create an instance with minimum required parameters', () => {
      const accountId = 'account456';
      const updateType = 'password';

      const event = new AccountUpdatedEvent(accountId, updateType);

      expect(event.accountId).toBe(accountId);
      expect(event.updateType).toBe(updateType);
      expect(event.changedBy).toBeUndefined();
      expect(event.accountData).toBeUndefined();
    });

    it('should handle all update types', () => {
      const accountId = 'account789';
      const updateTypes = [
        'profile',
        'password',
        'deactivation',
        'restoration',
        'auth-methods',
      ] as const;

      updateTypes.forEach((updateType) => {
        const event = new AccountUpdatedEvent(accountId, updateType);
        expect(event.updateType).toBe(updateType);
      });
    });

    it('should handle all changedBy values', () => {
      const accountId = 'account101';
      const updateType = 'profile';

      const changedByAdmin = new AccountUpdatedEvent(
        accountId,
        updateType,
        'admin',
      );
      expect(changedByAdmin.changedBy).toBe('admin');

      const changedBySelf = new AccountUpdatedEvent(
        accountId,
        updateType,
        'self',
      );
      expect(changedBySelf.changedBy).toBe('self');
    });

    it('should store account data correctly', () => {
      const accountId = 'account202';
      const updateType = 'profile';
      const accountData = {
        id: 'account202',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'admin',
        updatedAt: new Date('2024-01-01'),
      };

      const event = new AccountUpdatedEvent(
        accountId,
        updateType,
        'admin',
        accountData,
      );

      expect(event.accountData).toEqual(accountData);
      expect(event.accountData.name).toBe('Jane Smith');
      expect(event.accountData.role).toBe('admin');
    });

    it('should have the correct properties', () => {
      const event = new AccountUpdatedEvent('account123', 'profile');

      expect(event).toHaveProperty('accountId');
      expect(event).toHaveProperty('updateType');
      expect(event).toHaveProperty('changedBy');
      expect(event).toHaveProperty('accountData');
    });
  });

  describe('RoleUpdatedEvent', () => {
    it('should create an instance with all parameters', () => {
      const roleId = 'role123';
      const roleData = { name: 'Admin', permissions: ['read', 'write'] };

      const event = new RoleUpdatedEvent(roleId, roleData);

      expect(event.roleId).toBe(roleId);
      expect(event.roleData).toBe(roleData);
    });

    it('should create an instance with minimum required parameters', () => {
      const roleId = 'role456';

      const event = new RoleUpdatedEvent(roleId);

      expect(event.roleId).toBe(roleId);
      expect(event.roleData).toBeUndefined();
    });

    it('should store role data correctly', () => {
      const roleId = 'role789';
      const roleData = {
        id: 'role789',
        name: 'Manager',
        permissions: ['read', 'write', 'delete'],
        level: 2,
        createdAt: new Date('2024-01-01'),
      };

      const event = new RoleUpdatedEvent(roleId, roleData);

      expect(event.roleData).toEqual(roleData);
      expect(event.roleData.name).toBe('Manager');
      expect(event.roleData.permissions).toEqual(['read', 'write', 'delete']);
      expect(event.roleData.level).toBe(2);
    });

    it('should handle empty role data object', () => {
      const roleId = 'role101';
      const roleData = {};

      const event = new RoleUpdatedEvent(roleId, roleData);

      expect(event.roleData).toEqual({});
    });

    it('should have the correct properties', () => {
      const event = new RoleUpdatedEvent('role123');

      expect(event).toHaveProperty('roleId');
      expect(event).toHaveProperty('roleData');
    });

    it('should handle null role data', () => {
      const roleId = 'role202';
      const roleData = null;

      const event = new RoleUpdatedEvent(roleId, roleData);

      expect(event.roleData).toBeNull();
    });
  });
});
