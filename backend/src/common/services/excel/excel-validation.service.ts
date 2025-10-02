import { Injectable } from '@nestjs/common';
import {
  ExcelValidationRule,
  ExcelValidationResult,
  ExcelValidationError,
  ExcelValidationWarning,
  ExcelInvalidRow,
} from './interfaces/excel.interface';

/**
 * Service responsible for validating Excel data
 * Following Single Responsibility Principle - only handles validation operations
 */
@Injectable()
export class ExcelValidationService {
  /**
   * Validate Excel data against rules
   */
  async validate(
    data: any[],
    rules: ExcelValidationRule[],
  ): Promise<ExcelValidationResult> {
    const errors: ExcelValidationError[] = [];
    const warnings: ExcelValidationWarning[] = [];
    const validRows: any[] = [];
    const invalidRows: ExcelInvalidRow[] = [];

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      const rowNumber = rowIndex + 2; // Assuming header is row 1
      const rowErrors: ExcelValidationError[] = [];
      const rowWarnings: ExcelValidationWarning[] = [];

      for (const rule of rules) {
        const validationResult = await this.validateField(
          row[rule.field],
          rule,
          row,
          rowNumber,
        );

        if (validationResult.error) {
          rowErrors.push(validationResult.error);
          errors.push(validationResult.error);
        }

        if (validationResult.warning) {
          rowWarnings.push(validationResult.warning);
          warnings.push(validationResult.warning);
        }
      }

      if (rowErrors.length > 0) {
        invalidRows.push({
          rowNumber,
          data: row,
          errors: rowErrors,
          warnings: rowWarnings,
        });
      } else {
        validRows.push(row);
      }
    }

    // Check for uniqueness across all rows
    const uniqueErrors = await this.validateUniqueness(data, rules);
    errors.push(...uniqueErrors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validRows,
      invalidRows,
    };
  }

  /**
   * Validate a single field
   */
  private async validateField(
    value: any,
    rule: ExcelValidationRule,
    row: any,
    rowNumber: number,
  ): Promise<{
    error?: ExcelValidationError;
    warning?: ExcelValidationWarning;
  }> {
    const column = rule.field;

    switch (rule.type) {
      case 'required':
        if (this.isEmptyValue(value)) {
          return {
            error: {
              row: rowNumber,
              column,
              value,
              message: rule.message || `${column} is required`,
              type: 'required',
            },
          };
        }
        break;

      case 'email':
        if (value && !this.isValidEmail(value)) {
          return {
            error: {
              row: rowNumber,
              column,
              value,
              message:
                rule.message || `${column} must be a valid email address`,
              type: 'email',
            },
          };
        }
        break;

      case 'regex':
        if (value && rule.pattern && !rule.pattern.test(value.toString())) {
          return {
            error: {
              row: rowNumber,
              column,
              value,
              message: rule.message || `${column} format is invalid`,
              type: 'regex',
            },
          };
        }
        break;

      case 'date':
        if (value && !this.isValidDate(value)) {
          return {
            error: {
              row: rowNumber,
              column,
              value,
              message: rule.message || `${column} must be a valid date`,
              type: 'date',
            },
          };
        }
        break;

      case 'number':
        if (value !== null && value !== undefined && value !== '') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            return {
              error: {
                row: rowNumber,
                column,
                value,
                message: rule.message || `${column} must be a number`,
                type: 'number',
              },
            };
          }

          if (rule.min !== undefined && numValue < rule.min) {
            return {
              error: {
                row: rowNumber,
                column,
                value,
                message:
                  rule.message || `${column} must be at least ${rule.min}`,
                type: 'number',
              },
            };
          }

          if (rule.max !== undefined && numValue > rule.max) {
            return {
              error: {
                row: rowNumber,
                column,
                value,
                message:
                  rule.message || `${column} must be at most ${rule.max}`,
                type: 'number',
              },
            };
          }
        }
        break;

      case 'custom':
        if (rule.validator) {
          const isValid = await rule.validator(value, row);
          if (!isValid) {
            return {
              error: {
                row: rowNumber,
                column,
                value,
                message: rule.message || `${column} validation failed`,
                type: 'custom',
              },
            };
          }
        }
        break;
    }

    return {};
  }

  /**
   * Validate uniqueness across all rows
   */
  private async validateUniqueness(
    data: any[],
    rules: ExcelValidationRule[],
  ): Promise<ExcelValidationError[]> {
    const errors: ExcelValidationError[] = [];
    const uniqueRules = rules.filter((rule) => rule.type === 'unique');

    for (const rule of uniqueRules) {
      const values = new Map<any, number[]>();

      data.forEach((row, index) => {
        const value = row[rule.field];
        if (!this.isEmptyValue(value)) {
          const key = value.toString().toLowerCase();
          if (!values.has(key)) {
            values.set(key, []);
          }
          values.get(key)!.push(index + 2); // Row numbers start from 2
        }
      });

      values.forEach((rows, value) => {
        if (rows.length > 1) {
          rows.forEach((rowNumber) => {
            errors.push({
              row: rowNumber,
              column: rule.field,
              value: data[rowNumber - 2][rule.field],
              message:
                rule.message || `Duplicate value in ${rule.field}: ${value}`,
              type: 'unique',
            });
          });
        }
      });
    }

    return errors;
  }

  /**
   * Check if a value is empty
   */
  private isEmptyValue(value: any): boolean {
    return (
      value === null ||
      value === undefined ||
      value === '' ||
      (typeof value === 'string' && value.trim() === '')
    );
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate date
   */
  private isValidDate(value: any): boolean {
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }

    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  /**
   * Create validation rules from column definitions
   */
  createRulesFromColumns(
    columns: Array<{
      key: string;
      required?: boolean;
      type?: 'email' | 'date' | 'number' | 'text';
      unique?: boolean;
      pattern?: RegExp;
      min?: number;
      max?: number;
    }>,
  ): ExcelValidationRule[] {
    const rules: ExcelValidationRule[] = [];

    for (const column of columns) {
      if (column.required) {
        rules.push({
          field: column.key,
          type: 'required',
          message: `${column.key} is required`,
        });
      }

      if (column.type === 'email') {
        rules.push({
          field: column.key,
          type: 'email',
          message: `${column.key} must be a valid email address`,
        });
      }

      if (column.type === 'date') {
        rules.push({
          field: column.key,
          type: 'date',
          message: `${column.key} must be a valid date`,
        });
      }

      if (column.type === 'number') {
        rules.push({
          field: column.key,
          type: 'number',
          message: `${column.key} must be a number`,
          min: column.min,
          max: column.max,
        });
      }

      if (column.unique) {
        rules.push({
          field: column.key,
          type: 'unique',
          message: `${column.key} must be unique`,
        });
      }

      if (column.pattern) {
        rules.push({
          field: column.key,
          type: 'regex',
          pattern: column.pattern,
          message: `${column.key} format is invalid`,
        });
      }
    }

    return rules;
  }

  /**
   * Generate validation report
   */
  generateValidationReport(result: ExcelValidationResult): string {
    const lines: string[] = [];

    lines.push('Excel Validation Report');
    lines.push('='.repeat(50));
    lines.push(
      `Total Rows: ${result.validRows.length + result.invalidRows.length}`,
    );
    lines.push(`Valid Rows: ${result.validRows.length}`);
    lines.push(`Invalid Rows: ${result.invalidRows.length}`);
    lines.push('');

    if (result.errors.length > 0) {
      lines.push('Errors:');
      lines.push('-'.repeat(50));

      const groupedErrors = this.groupErrorsByRow(result.errors);

      for (const [row, errors] of groupedErrors) {
        lines.push(`Row ${row}:`);
        for (const error of errors) {
          lines.push(`  - ${error.column}: ${error.message}`);
        }
      }
      lines.push('');
    }

    if (result.warnings && result.warnings.length > 0) {
      lines.push('Warnings:');
      lines.push('-'.repeat(50));

      const groupedWarnings = this.groupWarningsByRow(result.warnings);

      for (const [row, warnings] of groupedWarnings) {
        lines.push(`Row ${row}:`);
        for (const warning of warnings) {
          lines.push(`  - ${warning.column}: ${warning.message}`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Group errors by row number
   */
  private groupErrorsByRow(
    errors: ExcelValidationError[],
  ): Map<number, ExcelValidationError[]> {
    const grouped = new Map<number, ExcelValidationError[]>();

    for (const error of errors) {
      if (!grouped.has(error.row)) {
        grouped.set(error.row, []);
      }
      grouped.get(error.row)!.push(error);
    }

    return grouped;
  }

  /**
   * Group warnings by row number
   */
  private groupWarningsByRow(
    warnings: ExcelValidationWarning[],
  ): Map<number, ExcelValidationWarning[]> {
    const grouped = new Map<number, ExcelValidationWarning[]>();

    for (const warning of warnings) {
      if (!grouped.has(warning.row)) {
        grouped.set(warning.row, []);
      }
      grouped.get(warning.row)!.push(warning);
    }

    return grouped;
  }
}
