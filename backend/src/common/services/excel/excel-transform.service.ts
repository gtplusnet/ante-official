import { Injectable } from '@nestjs/common';
import {
  ExcelTransformMapping,
  ExcelTransformOptions,
} from './interfaces/excel.interface';

/**
 * Service responsible for transforming Excel data
 * Following Single Responsibility Principle - only handles data transformation
 */
@Injectable()
export class ExcelTransformService {
  /**
   * Transform Excel data based on mappings
   */
  transform<T = any>(data: any[], options: ExcelTransformOptions): T[] {
    const transformed: T[] = [];

    for (const row of data) {
      // Skip empty rows if specified
      if (options.skipEmptyRows && this.isEmptyRow(row)) {
        continue;
      }

      const transformedRow = this.transformRow(row, options.mappings);

      // Preserve original fields if specified
      if (options.preserveOriginal) {
        Object.assign(transformedRow, row);
      }

      transformed.push(transformedRow as T);
    }

    return transformed;
  }

  /**
   * Transform a single row
   */
  private transformRow(row: any, mappings: ExcelTransformMapping[]): any {
    const transformed: any = {};

    for (const mapping of mappings) {
      const sourceValue = row[mapping.sourceColumn];

      let transformedValue: any;

      if (mapping.transformer) {
        transformedValue = mapping.transformer(sourceValue, row);
      } else if (sourceValue !== undefined && sourceValue !== null) {
        transformedValue = sourceValue;
      } else {
        transformedValue = mapping.defaultValue;
      }

      // Set nested properties if target field contains dots
      if (mapping.targetField.includes('.')) {
        this.setNestedProperty(
          transformed,
          mapping.targetField,
          transformedValue,
        );
      } else {
        transformed[mapping.targetField] = transformedValue;
      }
    }

    return transformed;
  }

  /**
   * Set nested property using dot notation
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Check if a row is empty
   */
  private isEmptyRow(row: any): boolean {
    return Object.values(row).every(
      (value) => value === null || value === undefined || value === '',
    );
  }

  /**
   * Common transformers
   */

  /**
   * Parse date transformer
   */
  static dateTransformer(_format?: string): (value: any) => Date | null {
    return (value: any) => {
      if (!value) return null;

      if (value instanceof Date) return value;

      // Handle Excel serial dates
      if (typeof value === 'number') {
        return new Date((value - 25569) * 86400 * 1000);
      }

      // Parse string dates
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    };
  }

  /**
   * Parse number transformer
   */
  static numberTransformer(defaultValue = 0): (value: any) => number {
    return (value: any) => {
      if (value === null || value === undefined || value === '') {
        return defaultValue;
      }

      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    };
  }

  /**
   * Parse boolean transformer
   */
  static booleanTransformer(
    trueValues = ['true', 'yes', '1', 'y'],
    falseValues = ['false', 'no', '0', 'n'],
  ): (value: any) => boolean | null {
    return (value: any) => {
      if (value === null || value === undefined) return null;

      const strValue = value.toString().toLowerCase().trim();

      if (trueValues.includes(strValue)) return true;
      if (falseValues.includes(strValue)) return false;

      return null;
    };
  }

  /**
   * Trim string transformer
   */
  static trimTransformer(): (value: any) => string {
    return (value: any) => {
      if (value === null || value === undefined) return '';
      return value.toString().trim();
    };
  }

  /**
   * Uppercase transformer
   */
  static uppercaseTransformer(): (value: any) => string {
    return (value: any) => {
      if (value === null || value === undefined) return '';
      return value.toString().toUpperCase();
    };
  }

  /**
   * Lowercase transformer
   */
  static lowercaseTransformer(): (value: any) => string {
    return (value: any) => {
      if (value === null || value === undefined) return '';
      return value.toString().toLowerCase();
    };
  }

  /**
   * Title case transformer
   */
  static titleCaseTransformer(): (value: any) => string {
    return (value: any) => {
      if (value === null || value === undefined) return '';

      return value
        .toString()
        .toLowerCase()
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
  }

  /**
   * Phone number formatter
   */
  static phoneTransformer(format = 'US'): (value: any) => string {
    return (value: any) => {
      if (!value) return '';

      const digits = value.toString().replace(/\D/g, '');

      if (format === 'US' && digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }

      if (format === 'PH' && digits.length === 11) {
        return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
      }

      return digits;
    };
  }

  /**
   * Currency transformer
   */
  static currencyTransformer(_currency = 'USD'): (value: any) => number {
    return (value: any) => {
      if (!value) return 0;

      // Remove currency symbols and commas
      const cleanValue = value.toString().replace(/[^0-9.-]/g, '');

      const num = parseFloat(cleanValue);
      return isNaN(num) ? 0 : num;
    };
  }

  /**
   * Enum transformer
   */
  static enumTransformer<T>(
    enumMap: Map<string, T>,
    defaultValue?: T,
  ): (value: any) => T | undefined {
    return (value: any) => {
      if (!value) return defaultValue;

      const key = value.toString().toLowerCase().trim();

      for (const [enumKey, enumValue] of enumMap) {
        if (enumKey.toLowerCase() === key) {
          return enumValue;
        }
      }

      return defaultValue;
    };
  }

  /**
   * Split string transformer
   */
  static splitTransformer(
    delimiter = ',',
    trim = true,
  ): (value: any) => string[] {
    return (value: any) => {
      if (!value) return [];

      const parts = value.toString().split(delimiter);

      if (trim) {
        return parts.map((part: string) => part.trim());
      }

      return parts;
    };
  }

  /**
   * JSON parser transformer
   */
  static jsonTransformer(): (value: any) => any {
    return (value: any) => {
      if (!value) return null;

      try {
        return JSON.parse(value.toString());
      } catch {
        return null;
      }
    };
  }

  /**
   * Concat transformer - combines multiple fields
   */
  static concatTransformer(
    fields: string[],
    separator = ' ',
  ): (value: any, row: any) => string {
    return (value: any, row: any) => {
      const values = fields
        .map((field) => row[field])
        .filter((v) => v !== null && v !== undefined && v !== '')
        .map((v) => v.toString());

      return values.join(separator);
    };
  }

  /**
   * Conditional transformer
   */
  static conditionalTransformer<T>(
    condition: (value: any, row: any) => boolean,
    trueValue: T | ((value: any, row: any) => T),
    falseValue: T | ((value: any, row: any) => T),
  ): (value: any, row: any) => T {
    return (value: any, row: any) => {
      const result = condition(value, row);

      if (result) {
        return typeof trueValue === 'function'
          ? (trueValue as (value: any, row: any) => T)(value, row)
          : trueValue;
      } else {
        return typeof falseValue === 'function'
          ? (falseValue as (value: any, row: any) => T)(value, row)
          : falseValue;
      }
    };
  }

  /**
   * Create auto-mapping based on column names
   */
  createAutoMapping(
    sourceColumns: string[],
    targetFields?: string[],
  ): ExcelTransformMapping[] {
    const mappings: ExcelTransformMapping[] = [];

    sourceColumns.forEach((column, index) => {
      const targetField = targetFields?.[index] || this.camelCase(column);

      mappings.push({
        sourceColumn: column,
        targetField,
        transformer: ExcelTransformService.trimTransformer(),
      });
    });

    return mappings;
  }

  /**
   * Convert string to camelCase
   */
  private camelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  }
}
