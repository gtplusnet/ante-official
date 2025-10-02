import * as ExcelJS from 'exceljs';

/**
 * Core Excel Interfaces following SOLID principles
 */

// Column configuration for Excel worksheets
export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  style?: ExcelJS.Style;
  numFmt?: string; // Number format (e.g., 'mm/dd/yyyy', '$#,##0.00')
}

// Dropdown configuration for data validation
export interface ExcelDropdown {
  columnKey: string;
  options: string[];
  allowBlank?: boolean;
  errorTitle?: string;
  errorMessage?: string;
}

// Date column configuration
export interface ExcelDateColumn {
  columnKey: string;
  format?: string; // Default: 'mm/dd/yyyy'
  minDate?: Date;
  maxDate?: Date;
  allowBlank?: boolean;
}

// Sheet configuration
export interface ExcelSheetConfig {
  name: string;
  columns: ExcelColumn[];
  data?: any[];
  dropdowns?: ExcelDropdown[];
  dateColumns?: ExcelDateColumn[];
  headerStyle?: Partial<ExcelJS.Style>;
  freezePane?: { row?: number; column?: number };
}

// Export options
export interface ExcelExportOptions {
  sheets?: ExcelSheetConfig[];
  filename?: string;
  author?: string;
  created?: Date;
  modified?: Date;
  lastModifiedBy?: string;
  properties?: ExcelJS.WorkbookProperties;
  protectWorkbook?: boolean;
  password?: string;
}

// Import options
export interface ExcelImportOptions {
  sheetIndex?: number; // Default: 0
  sheetName?: string; // Alternative to sheetIndex
  headerRow?: number; // Default: 1
  dataStartRow?: number; // Default: 2
  maxRows?: number; // Limit number of rows to import
  includeEmptyRows?: boolean; // Default: false
  dateFormat?: string; // Format for parsing dates
  trimValues?: boolean; // Default: true
}

// Parsed Excel data
export interface ExcelParsedData<T = any> {
  headers: string[];
  rows: T[];
  rawData?: any[][];
  metadata?: ExcelMetadata;
}

// Excel metadata
export interface ExcelMetadata {
  sheetName?: string;
  totalRows: number;
  totalColumns: number;
  emptyRows?: number;
  createdDate?: Date;
  modifiedDate?: Date;
  author?: string;
}

// Validation rule interface
export interface ExcelValidationRule {
  field: string;
  type:
    | 'required'
    | 'email'
    | 'regex'
    | 'custom'
    | 'date'
    | 'number'
    | 'unique';
  message?: string;
  pattern?: RegExp;
  validator?: (value: any, row?: any) => boolean | Promise<boolean>;
  min?: number;
  max?: number;
}

// Validation result
export interface ExcelValidationResult {
  isValid: boolean;
  errors: ExcelValidationError[];
  warnings?: ExcelValidationWarning[];
  validRows: any[];
  invalidRows: ExcelInvalidRow[];
}

// Validation error
export interface ExcelValidationError {
  row: number;
  column: string;
  value: any;
  message: string;
  type: string;
}

// Validation warning
export interface ExcelValidationWarning {
  row: number;
  column: string;
  value: any;
  message: string;
  type: string;
}

// Invalid row data
export interface ExcelInvalidRow {
  rowNumber: number;
  data: any;
  errors: ExcelValidationError[];
  warnings?: ExcelValidationWarning[];
}

// Transform mapping
export interface ExcelTransformMapping {
  sourceColumn: string;
  targetField: string;
  transformer?: (value: any, row?: any) => any;
  defaultValue?: any;
}

// Transform options
export interface ExcelTransformOptions {
  mappings: ExcelTransformMapping[];
  skipEmptyRows?: boolean;
  preserveOriginal?: boolean;
}

// Cell style configuration
export interface ExcelCellStyle {
  font?: ExcelJS.Font;
  fill?: ExcelJS.Fill;
  alignment?: ExcelJS.Alignment;
  border?: ExcelJS.Borders;
  numFmt?: string;
}

// Conditional formatting
export interface ExcelConditionalFormat {
  range: string; // e.g., 'A2:A100'
  rules: ExcelJS.ConditionalFormattingRule[];
}

// Chart configuration
export interface ExcelChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area';
  dataRange: string;
  position: { row: number; col: number };
  size?: { width: number; height: number };
  title?: string;
  legend?: boolean;
}

// Formula configuration
export interface ExcelFormula {
  cell: string;
  formula: string;
  arrayFormula?: boolean;
}

// Error handling
export interface ExcelError extends Error {
  code: string;
  details?: any;
  row?: number;
  column?: string;
}
