// Type definition for Multer file to resolve MulterFile issues
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
  stream?: NodeJS.ReadableStream;
}

// Re-export as a namespace-like type that matches usage patterns
export namespace Express {
  export namespace Multer {
    export type File = MulterFile;
  }
}
