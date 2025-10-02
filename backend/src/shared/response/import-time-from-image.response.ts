export interface ImportTimeFromImageResponse {
  status: string;
  remarks: string;
  logs: ImportTimeFromImageGeminiLog[];
  validationErrors?: ValidationError[];
}

export interface ImportTimeFromImageGeminiLog {
  employeeId: string;
  timeIn: string; // ISO date string
  timeOut: string; // ISO date string
  remarks: string;
  isValid?: boolean;
  validationError?: string;
}

export interface ImportTimeFromImageGeminiResponse {
  status: 'success' | 'error';
  remarks: string;
  logs: ImportTimeFromImageGeminiLog[];
}

export interface ValidationError {
  employeeId: string;
  error: string;
  timeIn?: string;
  timeOut?: string;
}
