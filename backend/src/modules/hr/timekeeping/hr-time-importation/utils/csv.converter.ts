import { Readable } from 'stream';
import * as csv from 'csv-parser';

export class CsvConverter {
  static async convertToText(base64Data: string): Promise<string> {
    try {
      // Remove data URL prefix if present
      const base64 = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data;
      const buffer = Buffer.from(base64, 'base64');
      const text = buffer.toString('utf8');

      // Return raw CSV text - AI can understand it well
      return text;
    } catch (error) {
      throw new Error(`Failed to convert CSV to text: ${error.message}`);
    }
  }

  static async parseToJson(base64Data: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        const base64 = base64Data.includes(',')
          ? base64Data.split(',')[1]
          : base64Data;
        const buffer = Buffer.from(base64, 'base64');
        const results = [];

        const stream = Readable.from(buffer);

        stream
          .pipe(
            csv({
              mapHeaders: ({ header }) => header.trim(),
            }),
          )
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', (error) =>
            reject(new Error(`CSV parsing error: ${error.message}`)),
          );
      } catch (error) {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  }
}
