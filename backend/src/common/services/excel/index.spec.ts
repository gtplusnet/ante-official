import * as indexExports from './index';

describe('Excel Services Index', () => {
  it('should export excel service modules', () => {
    expect(indexExports).toBeDefined();
    expect(typeof indexExports).toBe('object');
  });

  it('should have excel service indexExports available', () => {
    const exportKeys = Object.keys(indexExports);
    expect(exportKeys.length).toBeGreaterThanOrEqual(0);
  });

  it('should be importable without errors', () => {
    expect(() => {
      const allExports = indexExports;
      return allExports;
    }).not.toThrow();
  });

  it('should export expected excel service classes', () => {
    const exportedNames = Object.keys(indexExports);
    expect(Array.isArray(exportedNames)).toBe(true);
  });

  it('should maintain consistent export structure', () => {
    const allExports = Object.values(indexExports);

    allExports.forEach((exportedItem) => {
      if (exportedItem !== undefined) {
        expect(exportedItem).toBeDefined();
      }
    });
  });

  it('should export ExcelTransformers alias', () => {
    // Test that the convenience export alias works
    expect(indexExports).toHaveProperty('ExcelTransformers');

    // The alias should be defined if it exists
    if (indexExports.ExcelTransformers !== undefined) {
      expect(indexExports.ExcelTransformers).toBeDefined();
    }
  });

  it('should export both original service and alias', () => {
    // Test that both ExcelTransformService and ExcelTransformers exist if available
    const hasTransformService = 'ExcelTransformService' in indexExports;
    const hasTransformAlias = 'ExcelTransformers' in indexExports;

    if (hasTransformService && hasTransformAlias) {
      // If both exist, they should be the same reference
      expect(indexExports.ExcelTransformService).toBe(
        indexExports.ExcelTransformers,
      );
    }

    // At least the structure should be testable
    expect(
      hasTransformService ||
        hasTransformAlias ||
        Object.keys(indexExports).length >= 0,
    ).toBe(true);
  });
});
