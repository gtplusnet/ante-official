# Media Library Enhancement - Module-Based Media Management

## Overview

The Media Library Enhancement introduces a modular approach to media management across the ANTE ERP system. Each major module (CMS, Assets, Manpower, Treasury, School, Leads, Projects, Calendar) now has its own dedicated media library space with isolated file management.

## Key Features

- **Module Isolation**: Files are organized by module (CMS, ASSETS, MANPOWER, etc.)
- **Dedicated Navigation**: Each module has its own "Media Library" menu item
- **Centralized Components**: Reusable MediaLibraryCore and MediaLibraryDialog components
- **Backward Compatibility**: Existing files are migrated to CMS module
- **Type Safety**: Full TypeScript support with ModuleType enum

---

## User Guide

### Accessing Module Media Libraries

Each module now includes a "Media Library" navigation item in its submenu:

1. **CMS**: `/member/cms/media/library`
2. **Assets**: `/member/asset/media/library` 
3. **Manpower**: `/member/manpower/media/library`
4. **Treasury**: `/member/treasury/media/library`
5. **School**: `/member/school/media/library`
6. **Leads**: `/member/leads/media/library`

### Using the Media Library

1. **Navigate** to your desired module's Media Library
2. **Upload Files**: Click the upload button and select files
3. **Organize**: Create folders to organize content by category
4. **Select**: Use the media picker in forms and content creation
5. **Manage**: Edit, delete, or move files as needed

### Module-Specific Features

#### CMS Module
- Full media management capabilities
- Integration with content types and entries
- Support for all media types (images, documents, videos)

#### Assets Module
- Equipment documentation and photos
- Warehouse inventory images
- Purchase order attachments

#### Manpower Module  
- Employee documentation
- Payroll-related files
- Training materials

#### Treasury Module
- Financial document storage
- Receipt and invoice management
- Audit documentation

#### School Module
- Student records and photos
- Academic resource materials
- Administrative documents

#### Leads Module (CRM)
- Client presentations
- Proposal attachments  
- Contract documents

---

## Developer Guide

### Backend Implementation

#### Database Schema Changes

```prisma
// Added to Files model
model Files {
  id          String      @id @default(cuid())
  filename    String
  originalName String
  mimeType    String
  size        Int
  path        String
  module      ModuleType  @default(CMS)  // New field
  companyId   String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([module, companyId])
  @@index([companyId])
}

// New enum
enum ModuleType {
  CMS
  ASSETS  
  MANPOWER
  TREASURY
  SCHOOL
  LEADS
  PROJECTS
  CALENDAR
}
```

#### API Endpoints

**Upload with Module Support**
```typescript
POST /media/upload?module=ASSETS
Content-Type: multipart/form-data

Response:
{
  statusCode: 201,
  message: "Files uploaded successfully", 
  data: {
    files: [
      {
        id: "file-id",
        filename: "document.pdf",
        module: "ASSETS",
        // ... other file properties
      }
    ]
  }
}
```

**List Files by Module**
```typescript
GET /media/files?module=TREASURY&page=1&limit=20

Response:
{
  statusCode: 200,
  message: "Files retrieved successfully",
  data: {
    files: [...],
    pagination: {
      page: 1,
      limit: 20, 
      total: 150,
      totalPages: 8
    }
  }
}
```

#### DTOs

```typescript
// CreateMediaFileDto
export class CreateMediaFileDto {
  @IsEnum(ModuleType)
  @IsOptional()
  module?: ModuleType = ModuleType.CMS;
  
  // ... other properties
}

// MediaFileQueryDto  
export class MediaFileQueryDto extends PaginationDto {
  @IsEnum(ModuleType) 
  @IsOptional()
  module?: ModuleType;

  @IsString()
  @IsOptional()
  search?: string;
}
```

### Frontend Implementation

#### TypeScript Types

```typescript
// types/media.types.ts
export enum ModuleType {
  CMS = 'CMS',
  ASSETS = 'ASSETS', 
  MANPOWER = 'MANPOWER',
  TREASURY = 'TREASURY',
  SCHOOL = 'SCHOOL',
  LEADS = 'LEADS',
  PROJECTS = 'PROJECTS',
  CALENDAR = 'CALENDAR'
}

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  module: ModuleType;
  // ... other properties
}
```

#### Component Usage

**MediaLibraryDialog with Module**
```vue
<template>
  <MediaLibraryDialog
    v-model="showDialog"
    :module="ModuleType.ASSETS"
    :selection-mode="'single'"
    @files-selected="handleFilesSelected"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ModuleType } from '@shared/types/media.types';
import MediaLibraryDialog from '@components/shared/MediaLibrary/MediaLibraryDialog.vue';

const showDialog = ref(false);

const handleFilesSelected = (files: MediaFile[]) => {
  console.log('Selected files:', files);
};
</script>
```

**MediaLibraryCore for Full Page**
```vue
<template>
  <MediaLibraryCore
    mode="page"
    :module="ModuleType.TREASURY"
    :selection-mode="'multiple'"
    :allow-upload="true"
    :allow-folders="true"
    library-title="Treasury Media Library"
  />
</template>
```

#### Module Configuration Factory

```typescript
// composables/useModuleConfig.ts
export const useModuleConfig = () => {
  const getModuleConfig = (module: ModuleType) => {
    const configs = {
      [ModuleType.CMS]: {
        name: 'CMS',
        color: 'primary',
        icon: 'content_paste',
        allowedTypes: ['image', 'document', 'video', 'audio']
      },
      [ModuleType.ASSETS]: {
        name: 'Assets',
        color: 'orange',
        icon: 'inventory_2', 
        allowedTypes: ['image', 'document', 'video']
      },
      // ... other modules
    };
    
    return configs[module];
  };

  return { getModuleConfig };
};
```

### Navigation Integration

Each module's submenu includes a Media Library item:

```typescript
// Example: AssetSubMenu.vue
const navList = ref<NavItem[]>([
  // ... other nav items
  {
    title: 'Media Library',
    key: 'member_asset_media_library', 
    icon: 'o_perm_media',
  },
]);
```

### Store Integration

```typescript
// stores/media.store.ts
export const useMediaStore = defineStore('media', () => {
  const getFilesByModule = async (module: ModuleType, options?: MediaQueryOptions) => {
    const params = new URLSearchParams({
      module,
      ...options
    });
    
    const response = await api.get(`/media/files?${params}`);
    return response.data;
  };

  const uploadFiles = async (files: File[], module: ModuleType) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const response = await api.post(`/media/upload?module=${module}`, formData);
    return response.data;
  };

  return {
    getFilesByModule,
    uploadFiles,
  };
});
```

---

## Migration Guide

### Database Migration

For existing installations, run the migration to set existing files to CMS module:

```bash
# From backend directory
yarn migrate:existing-files

# Or manually
node scripts/migrate-existing-files-to-cms.js
```

This script will:
- Find all files without a module assignment
- Set their module to 'CMS' for backward compatibility  
- Provide statistics on the migration

### Route Configuration

Ensure routes are configured for each module's media library:

```typescript
// routes/member.routes.ts
{
  path: '/treasury/media/library',
  name: 'member_treasury_media_library',
  component: () => import('@pages/Member/Treasury/TreasuryMediaLibrary.vue'),
  meta: { requiresAuth: true }
},
{
  path: '/school/media/library', 
  name: 'member_school_media_library',
  component: () => import('@pages/Member/School/SchoolMediaLibrary.vue'),
  meta: { requiresAuth: true }  
}
```

---

## Best Practices

### Module Selection
- Always specify the correct module when uploading files
- Use module-specific media libraries for better organization
- Avoid mixing module content unless there's a specific business need

### Component Reusability  
- Use MediaLibraryDialog for form integrations
- Use MediaLibraryCore for full-page media libraries
- Leverage the module configuration factory for consistent styling

### Performance
- Files are automatically indexed by module for faster queries
- Use pagination for large media libraries
- Consider implementing lazy loading for image galleries

### Security
- Module isolation prevents cross-module file access
- All uploads require authentication
- File access is restricted by company/tenant isolation

---

## Testing

### Backend Testing
```bash
# Test media endpoints
yarn test:api -- --testNamePattern="media"

# Test file upload with modules
yarn test:api -- --testNamePattern="MediaController"
```

### Frontend Testing
```bash
# Test media library components
yarn test:e2e -- tests/e2e/media-library.spec.ts

# Test module navigation
yarn test:e2e -- tests/e2e/module-navigation.spec.ts
```

### Manual Testing Checklist
- [ ] Upload files to each module's media library
- [ ] Verify files appear only in the correct module
- [ ] Test media selection in forms/dialogs
- [ ] Verify folder creation and organization
- [ ] Test search and filtering functionality
- [ ] Confirm migration script works correctly

---

## Troubleshooting

### Common Issues

**Files not appearing in module library**
- Verify the module parameter is correctly passed
- Check that files were uploaded with the correct module assignment
- Ensure proper authentication and company context

**Migration script fails**
- Check database connection
- Verify Prisma client is generated
- Ensure proper permissions on the database

**Navigation not working**
- Verify routes are properly configured
- Check that navigation keys match route names
- Ensure proper access control permissions

### Debug Commands

```bash
# Check file module distribution
npx prisma studio  # Browse Files table

# View migration status  
yarn migrate:existing-files

# Check API endpoints
curl -H "token: YOUR_TOKEN" "http://localhost:3000/media/files?module=ASSETS"
```

---

## Extending to New Modules

To add media library support to a new module:

1. **Add to ModuleType enum** (backend and frontend)
2. **Create module media library page** following existing patterns
3. **Add navigation item** to module's submenu 
4. **Configure route** in the routing system
5. **Update module config factory** with module-specific settings
6. **Test thoroughly** across upload, selection, and management flows

---

## Support

For additional support or questions about the Media Library Enhancement:

1. Check this documentation first
2. Review the test files for usage examples
3. Examine existing module implementations for patterns
4. Consult the API documentation for endpoint details

This feature provides a scalable foundation for media management across all current and future ANTE ERP modules.