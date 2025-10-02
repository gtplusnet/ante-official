# Frontend Import Aliases Guide

This guide explains the import patterns and aliases available in the GEER-ANTE frontend.

## Current Status

### ⚠️ Important: Aliases are Development-Only

The path aliases configured in `quasar.config.js` and `tsconfig.json` provide better developer experience but **do not work in production builds**. This is a known limitation with Vite/Rollup in the current Quasar setup.

## Recommended Import Patterns

### 1. Quasar Boot Files (✅ Works Everywhere)
```typescript
// Always use this pattern for boot files
import { api } from 'src/boot/axios';
import { bus } from 'src/boot/bus';
```

### 2. Relative Imports (✅ Works Everywhere)
```typescript
// Use relative paths for all other imports
import { useAuthStore } from '../stores/auth';
import TaskDialog from '../components/dialog/TaskDialog.vue';
import { handleError } from '../../utility/error-handler';
```

### 3. Shared Backend Interfaces (✅ Works Everywhere)
```typescript
// Use relative path to backend shared folder
import { UserResponse } from '../../../backend/src/shared/response';
import { TaskStatus } from '../../../backend/src/shared/enums/task-status.enum';
```

## Configured Aliases (Development Only)

These aliases are configured and will work during development with hot-reload, but **will cause build errors**:

| Alias | Path | Status |
|-------|------|--------|
| `@/` | `src/` | ⚠️ Dev only |
| `@components/` | `src/components/` | ⚠️ Dev only |
| `@layouts/` | `src/layouts/` | ⚠️ Dev only |
| `@pages/` | `src/pages/` | ⚠️ Dev only |
| `@stores/` | `src/stores/` | ⚠️ Dev only |
| `@utils/` | `src/utility/` | ⚠️ Dev only |
| `@interfaces/` | `src/interfaces/` | ⚠️ Dev only |
| `@shared/` | `../backend/src/shared/` | ⚠️ Dev only |

## Examples

### ❌ Don't Use (Breaks Build)
```typescript
import { useAuthStore } from '@stores/auth';
import { NotificationResponse } from '@shared/response';
import TaskDialog from '@components/dialog/TaskDialog.vue';
```

### ✅ Do Use (Works in Build)
```typescript
import { useAuthStore } from '../stores/auth';
import { NotificationResponse } from '../../../backend/src/shared/response';
import TaskDialog from '../components/dialog/TaskDialog.vue';
```

## Special Cases

### Assets and Static Files
```typescript
// Use Vite's asset handling
import logoUrl from '@/assets/logo.png'; // ⚠️ Dev only
import logoUrl from '../assets/logo.png'; // ✅ Works everywhere
```

### Dynamic Imports
```typescript
// Dynamic imports with relative paths
const MyComponent = () => import('../components/MyComponent.vue');
```

## IDE Support

Even though we can't use aliases in production builds, they're still configured in `tsconfig.json` to provide:
- IntelliSense autocomplete during development
- Proper type checking
- Go-to-definition navigation

Your IDE will recognize the aliases, but remember to convert them to relative imports before building.

## Best Practices

1. **Always use relative imports** for production code
2. **Use `src/boot/` pattern** for Quasar boot files
3. **Test the build frequently** to catch import issues early
4. **Document import patterns** in your team's coding standards
5. **Consider the trade-off** between clean imports and build compatibility

## Future Improvements

We're investigating solutions to make aliases work in production builds:
1. Custom Vite plugin for alias resolution
2. Upgrading Quasar/Vite versions
3. Alternative build configurations

Until then, stick with relative imports for reliability.

## Quick Reference

```typescript
// Boot files (Quasar convention)
import { api } from 'src/boot/axios';

// Components
import MyComponent from '../components/MyComponent.vue';

// Stores
import { useMyStore } from '../stores/myStore';

// Utilities
import { myUtil } from '../utility/myUtil';

// Shared interfaces from backend
import { MyInterface } from '../../../backend/src/shared/response';

// Assets
import myImage from '../assets/my-image.png';
```

## Migration Guide

If you have existing code using aliases:

1. **Find all alias imports**:
   ```bash
   grep -r "@components\|@stores\|@utils\|@shared" src/
   ```

2. **Replace with relative imports**:
   - `@components/` → `../components/` (adjust ../ based on file location)
   - `@stores/` → `../stores/`
   - `@utils/` → `../utility/`
   - `@shared/` → `../../../backend/src/shared/`

3. **Test the build**:
   ```bash
   yarn build
   ```

4. **Verify in development**:
   ```bash
   yarn dev
   ```