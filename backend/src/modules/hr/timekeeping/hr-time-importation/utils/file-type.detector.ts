export enum FileType {
  IMAGE = 'image',
  EXCEL = 'excel',
  CSV = 'csv',
  PDF = 'pdf',
  UNKNOWN = 'unknown',
}

export class FileTypeDetector {
  static detectFromBase64(base64: string): FileType {
    // Extract mime type if present in data URL
    const dataUrlMatch = base64.match(/^data:([A-Za-z-+/]+);base64,/);
    if (dataUrlMatch) {
      const mimeType = dataUrlMatch[1];
      return this.detectFromMimeType(mimeType);
    }

    // Try to detect from base64 content
    try {
      const decoded = Buffer.from(base64.substring(0, 100), 'base64');
      return this.detectFromBuffer(decoded);
    } catch {
      return FileType.UNKNOWN;
    }
  }

  static detectFromMimeType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
      return FileType.EXCEL;
    if (mimeType.includes('csv')) return FileType.CSV;
    if (mimeType.includes('pdf')) return FileType.PDF;
    return FileType.UNKNOWN;
  }

  static detectFromFileName(fileName: string): FileType {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return FileType.IMAGE;
      case 'xlsx':
      case 'xls':
        return FileType.EXCEL;
      case 'csv':
        return FileType.CSV;
      case 'pdf':
        return FileType.PDF;
      default:
        return FileType.UNKNOWN;
    }
  }

  static detectFromBuffer(buffer: Buffer): FileType {
    // Check magic numbers
    const hex = buffer.toString('hex', 0, 4);

    // PDF
    if (hex.startsWith('25504446')) return FileType.PDF;

    // XLSX (ZIP format)
    if (hex.startsWith('504b0304')) return FileType.EXCEL;

    // XLS
    if (hex.startsWith('d0cf11e0')) return FileType.EXCEL;

    // Images
    if (hex.startsWith('ffd8ff')) return FileType.IMAGE; // JPEG
    if (hex.startsWith('89504e47')) return FileType.IMAGE; // PNG
    if (hex.startsWith('47494638')) return FileType.IMAGE; // GIF

    // CSV (text-based, harder to detect)
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 100));
    if (text.includes(',') && text.split('\n').length > 1) {
      return FileType.CSV;
    }

    return FileType.UNKNOWN;
  }

  static extractBase64Data(base64: string): string {
    const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    return matches ? matches[2] : base64;
  }
}
