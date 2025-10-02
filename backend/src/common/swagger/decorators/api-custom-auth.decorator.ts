import { applyDecorators } from '@nestjs/common';
import { ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';

/**
 * Custom decorator for documenting endpoints that require token authentication
 * Applies the custom-token security scheme and adds unauthorized response documentation
 */
export function ApiCustomAuth() {
  return applyDecorators(
    ApiSecurity('custom-token'),
    ApiUnauthorizedResponse({
      description: 'Invalid or missing authentication token',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Unauthorized' },
          error: { type: 'string', example: 'Unauthorized' },
        },
      },
    }),
  );
}
