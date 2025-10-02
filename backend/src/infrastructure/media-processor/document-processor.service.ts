import { Injectable, Logger } from '@nestjs/common';

export interface ProcessedDocument {
  originalSize: number;
  filename: string;
  mimetype: string;
  pageCount?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);

  private readonly supportedMimeTypes = [
    // PDF
    'application/pdf',

    // Microsoft Office
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx

    // Text files
    'text/plain',
    'text/csv',
    'application/rtf',

    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
  ];

  /**
   * Check if a mimetype is a supported document
   */
  isDocumentSupported(mimetype: string): boolean {
    return this.supportedMimeTypes.includes(mimetype);
  }

  /**
   * Get file extension from mimetype
   */
  getExtensionFromMimetype(mimetype: string): string {
    const extensions: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        'pptx',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
      'text/plain': 'txt',
      'text/csv': 'csv',
      'application/rtf': 'rtf',
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar',
      'application/x-7z-compressed': '7z',
      'application/x-tar': 'tar',
      'application/gzip': 'gz',
    };

    return extensions[mimetype] || 'unknown';
  }

  /**
   * Process document file (basic metadata extraction)
   */
  async processDocument(
    buffer: Buffer,
    mimetype: string,
    filename: string,
  ): Promise<ProcessedDocument> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Processing document: ${filename} (${mimetype}, ${buffer.length} bytes)`,
      );

      const result: ProcessedDocument = {
        originalSize: buffer.length,
        filename,
        mimetype,
      };

      // For PDF files, we could extract page count and metadata here
      // For now, just return basic info
      if (mimetype === 'application/pdf') {
        // TODO: Add PDF-specific processing if needed
        // Could use pdf-parse or pdf2pic libraries
        result.metadata = {
          type: 'PDF Document',
          extension: 'pdf',
        };
      }

      const processingTime = (Date.now() - startTime) / 1000;
      this.logger.log(`Document processed in ${processingTime}s: ${filename}`);

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process document ${filename}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Estimate processing time for document (very fast since no heavy processing)
   */
  estimateProcessingTime(size: number): number {
    // Documents don't need heavy processing, so estimate is very low
    return Math.max(0.1, size / 1000000); // 1MB per second
  }

  /**
   * Validate document file
   */
  validateDocument(
    buffer: Buffer,
    mimetype: string,
  ): { valid: boolean; error?: string } {
    if (!this.isDocumentSupported(mimetype)) {
      return { valid: false, error: `Unsupported document type: ${mimetype}` };
    }

    if (buffer.length === 0) {
      return { valid: false, error: 'Document file is empty' };
    }

    // Basic validation - could be extended with format-specific checks
    return { valid: true };
  }
}
