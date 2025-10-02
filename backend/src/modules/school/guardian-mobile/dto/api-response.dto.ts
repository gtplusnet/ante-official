export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ApiMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiMetadata {
  timestamp: string;
  version: string;
  requestId?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class ApiResponseBuilder {
  static success<T>(data: T, metadata?: Partial<ApiMetadata>): ApiResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        version: process.env.GUARDIAN_API_VERSION || 'v1',
        ...metadata,
      },
    };
  }

  static error(
    code: string,
    message: string,
    details?: any,
    metadata?: Partial<ApiMetadata>,
  ): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: process.env.GUARDIAN_API_VERSION || 'v1',
        ...metadata,
      },
    };
  }

  static paginated<T>(
    items: T[],
    page: number,
    limit: number,
    total: number,
    metadata?: Partial<ApiMetadata>,
  ): ApiResponse<PaginatedResponse<T>> {
    return {
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: process.env.GUARDIAN_API_VERSION || 'v1',
        ...metadata,
      },
    };
  }
}
