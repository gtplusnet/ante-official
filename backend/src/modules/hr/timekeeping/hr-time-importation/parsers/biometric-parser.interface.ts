import { ImportTimeFromImageResponse } from '../../../../../shared/response/import-time-from-image.response';

export interface BiometricParser {
  /**
   * Parse file data and extract time logs
   * @param base64Data - Base64 encoded file data
   * @param fileName - Original file name
   * @param remarks - User remarks/comments
   * @returns Parsed time logs in standard format
   */
  parse(
    base64Data: string,
    fileName: string,
    remarks: string,
  ): Promise<ImportTimeFromImageResponse>;

  /**
   * Validate if the file format matches expected template
   * @param base64Data - Base64 encoded file data
   * @returns True if file matches expected format
   */
  validateFormat(base64Data: string): Promise<boolean>;

  /**
   * Get supported file extensions for this parser
   * @returns Array of supported extensions (e.g., ['.xlsx', '.xls'])
   */
  getSupportedExtensions(): string[];
}
