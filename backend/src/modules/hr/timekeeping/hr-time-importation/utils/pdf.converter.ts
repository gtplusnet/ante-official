import * as pdfParse from 'pdf-parse';

export class PdfConverter {
  static async convertToText(base64Data: string): Promise<string> {
    try {
      // Remove data URL prefix if present
      const base64 = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data;
      const buffer = Buffer.from(base64, 'base64');

      // Parse PDF
      const data = await pdfParse(buffer);

      // Return extracted text
      return data.text;
    } catch (error) {
      throw new Error(`Failed to convert PDF to text: ${error.message}`);
    }
  }

  static async extractMetadata(base64Data: string): Promise<any> {
    try {
      const base64 = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data;
      const buffer = Buffer.from(base64, 'base64');

      const data = await pdfParse(buffer);

      return {
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata,
        text: data.text,
      };
    } catch (error) {
      throw new Error(`Failed to extract PDF metadata: ${error.message}`);
    }
  }
}
