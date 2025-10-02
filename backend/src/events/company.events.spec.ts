import {
  CompanyCreatedEvent,
  CompanyUpdatedEvent,
  CompanyDeletedEvent,
} from './company.events';

describe('Company Events', () => {
  describe('CompanyCreatedEvent', () => {
    it('should create an instance with all parameters', () => {
      const companyId = 123;
      const companyName = 'ACME Corp';
      const companyData = {
        address: '123 Business St',
        phone: '+1234567890',
      };

      const event = new CompanyCreatedEvent(
        companyId,
        companyName,
        companyData,
      );

      expect(event.companyId).toBe(companyId);
      expect(event.companyName).toBe(companyName);
      expect(event.companyData).toBe(companyData);
    });

    it('should create an instance with minimum required parameters', () => {
      const companyId = 456;
      const companyName = 'TechCorp';

      const event = new CompanyCreatedEvent(companyId, companyName);

      expect(event.companyId).toBe(companyId);
      expect(event.companyName).toBe(companyName);
      expect(event.companyData).toBeUndefined();
    });

    it('should have the correct properties', () => {
      const event = new CompanyCreatedEvent(123, 'Test Corp');

      expect(event).toHaveProperty('companyId');
      expect(event).toHaveProperty('companyName');
      expect(event).toHaveProperty('companyData');
    });
  });

  describe('CompanyUpdatedEvent', () => {
    it('should create an instance with all parameters', () => {
      const companyId = 123;
      const companyName = 'ACME Corp';
      const updatedFields = ['name', 'address'];
      const companyData = {
        name: 'ACME Corporation',
        address: '456 New St',
        phone: '+1234567890',
      };

      const event = new CompanyUpdatedEvent(
        companyId,
        companyName,
        updatedFields,
        companyData,
      );

      expect(event.companyId).toBe(companyId);
      expect(event.companyName).toBe(companyName);
      expect(event.updatedFields).toBe(updatedFields);
      expect(event.companyData).toBe(companyData);
    });

    it('should create an instance with minimum required parameters', () => {
      const companyId = 456;
      const companyName = 'TechCorp';

      const event = new CompanyUpdatedEvent(companyId, companyName);

      expect(event.companyId).toBe(companyId);
      expect(event.companyName).toBe(companyName);
      expect(event.updatedFields).toBeUndefined();
      expect(event.companyData).toBeUndefined();
    });

    it('should handle multiple updated fields', () => {
      const companyId = 789;
      const companyName = 'Global Corp';
      const updatedFields = ['name', 'address', 'phone', 'email', 'website'];

      const event = new CompanyUpdatedEvent(
        companyId,
        companyName,
        updatedFields,
      );

      expect(event.updatedFields).toEqual(updatedFields);
      expect(event.updatedFields).toHaveLength(5);
    });

    it('should handle single updated field', () => {
      const companyId = 101;
      const companyName = 'SingleUpdate Corp';
      const updatedFields = ['name'];

      const event = new CompanyUpdatedEvent(
        companyId,
        companyName,
        updatedFields,
      );

      expect(event.updatedFields).toEqual(['name']);
      expect(event.updatedFields).toHaveLength(1);
    });

    it('should handle empty updated fields array', () => {
      const companyId = 202;
      const companyName = 'EmptyFields Corp';
      const updatedFields: string[] = [];

      const event = new CompanyUpdatedEvent(
        companyId,
        companyName,
        updatedFields,
      );

      expect(event.updatedFields).toEqual([]);
      expect(event.updatedFields).toHaveLength(0);
    });

    it('should store company data correctly', () => {
      const companyId = 303;
      const companyName = 'DataTest Corp';
      const companyData = {
        id: 303,
        name: 'DataTest Corporation',
        address: '789 Data Avenue',
        phone: '+1987654321',
        email: 'info@datatest.com',
        website: 'https://datatest.com',
        industry: 'Technology',
        employees: 150,
        updatedAt: new Date('2024-01-01'),
      };

      const event = new CompanyUpdatedEvent(
        companyId,
        companyName,
        ['name', 'address'],
        companyData,
      );

      expect(event.companyData).toEqual(companyData);
      expect(event.companyData.name).toBe('DataTest Corporation');
      expect(event.companyData.industry).toBe('Technology');
      expect(event.companyData.employees).toBe(150);
    });

    it('should have the correct properties', () => {
      const event = new CompanyUpdatedEvent(123, 'Test Corp');

      expect(event).toHaveProperty('companyId');
      expect(event).toHaveProperty('companyName');
      expect(event).toHaveProperty('updatedFields');
      expect(event).toHaveProperty('companyData');
    });
  });

  describe('CompanyDeletedEvent', () => {
    it('should create an instance with required parameters', () => {
      const companyId = 123;
      const companyName = 'Deleted Corp';

      const event = new CompanyDeletedEvent(companyId, companyName);

      expect(event.companyId).toBe(companyId);
      expect(event.companyName).toBe(companyName);
    });

    it('should handle different company names', () => {
      const testCases = [
        { id: 1, name: 'Short' },
        { id: 2, name: 'Very Long Company Name With Many Words Inc.' },
        { id: 3, name: 'Company-With-Dashes' },
        { id: 4, name: 'Company & Associates LLC' },
        { id: 5, name: '123 Numeric Company' },
      ];

      testCases.forEach(({ id, name }) => {
        const event = new CompanyDeletedEvent(id, name);
        expect(event.companyId).toBe(id);
        expect(event.companyName).toBe(name);
      });
    });

    it('should handle numeric company IDs correctly', () => {
      const companyIds = [0, 1, 999, 1000, 99999];

      companyIds.forEach((id) => {
        const event = new CompanyDeletedEvent(id, `Company ${id}`);
        expect(event.companyId).toBe(id);
        expect(typeof event.companyId).toBe('number');
      });
    });

    it('should have the correct properties', () => {
      const event = new CompanyDeletedEvent(123, 'Test Corp');

      expect(event).toHaveProperty('companyId');
      expect(event).toHaveProperty('companyName');
    });
  });
});
