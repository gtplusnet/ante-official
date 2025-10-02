# SelectOptionsModule

## Purpose
A backend module that provides standardized API endpoints for dropdown select options used throughout the Ante application. It centralizes the management of common dropdown options, such as business types and industries, ensuring consistency and reducing duplication across the application.

## Usage Instructions

### Module Definition
```typescript
// select-options.module.ts
import { Module } from '@nestjs/common';
import { SelectOptionsController } from './select-options.controller';

@Module({
  controllers: [SelectOptionsController],
  exports: [],
})
export class SelectOptionsModule {}
```

### Controller Implementation
```typescript
// select-options.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BusinessType, Industry } from '@prisma/client';

@ApiTags('Select Options')
@Controller('select-options')
export class SelectOptionsController {
  @Get('business-types')
  getBusinessTypes() {
    return Object.entries(BusinessType).map(([key, value]) => ({
      label: this.formatLabel(key),
      value,
    }));
  }

  @Get('industries')
  getIndustries() {
    return Object.entries(Industry).map(([key, value]) => ({
      label: this.formatLabel(key),
      value,
    }));
  }

  private formatLabel(key: string): string {
    return key
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
}
```

## Available Endpoints

| Endpoint | Method | Description | Response Format |
|----------|--------|-------------|----------------|
| `/select-options/business-types` | GET | Returns a list of business types | Array of `{label, value}` objects |
| `/select-options/industries` | GET | Returns a list of industries | Array of `{label, value}` objects |

## Frontend Connection
This module is designed to work with the GSelect component in the frontend, which makes API requests to these endpoints to populate dropdown options. See `/frontend/templates/components/GSelect.md` for details on the frontend implementation.

## Dependencies
- NestJS framework
- Prisma ORM (for enum definitions)
- @nestjs/swagger (for API documentation)

## Examples

### Adding a New Option Endpoint
```typescript
@Get('new-option-type')
getNewOptionType() {
  return Object.entries(NewOptionEnum).map(([key, value]) => ({
    label: this.formatLabel(key),
    value,
  }));
}
```

### Frontend Usage Example
```vue
<GSelect
  v-model="formData.businessType"
  api-url="/select-options/business-types"
  :null-option="'Select Business Type'"
/>
```

## Contact
For questions or improvements, contact the backend development team.
