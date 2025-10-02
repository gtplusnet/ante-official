---
description: Use this when developing frontend related features
globs: 
alwaysApply: false
---
## Frontend Integration (Vue 3 + TypeScript)

### Mandatory: TypeScript and Composition API

All new Vue components **MUST** be written using:
- **TypeScript** for type safety
- **Composition API** (with `<script setup>` syntax preferred)

---
**API Call Rule:**
- **Do NOT use async/await for API calls. Always use .then(), .catch(), and .finally() for all API interactions.**
---

#### Example Component Structure
```vue
<template>
  <!-- Your template here -->
</template>

<script setup lang="ts">
// Always use TypeScript
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'src/boot/axios';
import { SomeResponseType } from '@shared/response';
import { handleAxiosError } from 'src/utility/axios.error.handler';

// Component logic using Composition API
const props = defineProps<{
  // Type-safe props
  itemId: string;
  isActive: boolean;
}>();

const emit = defineEmits<{
  // Type-safe events
  (e: 'update:isActive', value: boolean): void;
  (e: 'success'): void;
}>();

// State
const isLoading = ref(false);
const items = ref<SomeResponseType[]>([]);

// Computed
const itemCount = computed(() => items.value.length);

// Methods
function fetchItems() {
  isLoading.value = true;
  api.get<SomeResponseType[]>('/api/items')
    .then((response) => {
      items.value = response.data;
    })
    .catch((error) => {
      handleAxiosError(error, 'Failed to load items');
    })
    .finally(() => {
      isLoading.value = false;
    });
}

// Lifecycle hooks
onMounted(() => {
  fetchItems();
});
</script>

<style scoped>
/* Component styles */
</style>
```

### @shared Usage Guide

The `@shared` alias points to the `backend/shared` directory, ensuring type consistency between frontend and backend. This is a critical part of the project's architecture.

#### Importing Shared Interfaces

```typescript
// Importing from response interfaces
import { 
  CutoffDateRangeResponse, 
  SalaryInformationListResponse 
} from '@shared/response';

// Importing from request interfaces
import { PayrollProcessingRequest } from '@shared/request';
```

#### Example from PayrollSummaryDialog.vue

1. **Response Interface Usage**:
   ```typescript
   // In component props
   props: {
     selectedPayroll: {
       type: Object as () => CutoffDateRangeResponse,
       default: null,
     },
     // ...
   }
   
   // In component setup
   const payrollProcessingList: Ref<SalaryInformationListResponse[]> = ref([]);
   ```

2. **API Call Pattern**:
   ```typescript
   // Using the api instance with proper typing
   api
     .get<SalaryInformationListResponse[]>('/api/payroll/processing', {
       params: {
         cutoffId: props.selectedPayroll.key,
         // Always use query parameters instead of path parameters
       }
     })
     .then((response) => {
       payrollProcessingList.value = response.data;
     })
     .catch((error) => {
       handleAxiosError(error, 'Failed to load payroll data');
     });
   ```

### Key Rules

1. **Always Use @shared for Types**
   - All interfaces used for API communication must come from `@shared`
   - Never create duplicate interfaces in the frontend

2. **Response Interfaces** (`@shared/response`)
   - Use for typing API response data
   - Apply to variables that hold API responses
   - Example: `SalaryInformationListResponse[]` for lists

3. **Request Interfaces** (`@shared/request`)
   - Use for typing API request payloads
   - Apply to form data objects and API call parameters

4. **API Calls**
   ```typescript
   // Good - Using then/catch
   api.get<ResponseType>('/endpoint', { params })
     .then(handleSuccess)
     .catch(handleError);
   
   // Avoid - Using async/await
   // try {
   //   const response = await api.get<ResponseType>('/endpoint');
   // } catch (error) {
   //   handleError(error);
   // }
   ```

5. **Error Handling**
   ```typescript
   import { handleAxiosError } from 'src/utility/axios.error.handler';
   
   // In API calls
   .catch((error) => {
     handleAxiosError(error, 'User-friendly error message');
   });
   ```

6. **URL Parameters**
   - ❌ Avoid: `/api/items/:id`
   - ✅ Prefer: `/api/items?id=123`

### Best Practices

1. **Type Safety**
   - Always type your API responses and props
   - Use `as const` for literal types when needed

2. **Component Props**
   ```typescript
   import { defineComponent } from 'vue';
   import { EmployeeDataResponse } from '@shared/response';
   
   export default defineComponent({
     props: {
       employee: {
         type: Object as () => EmployeeDataResponse,
         required: true
       },
       // ...
     }
   });
   ```

3. **API Service Pattern**
   ```typescript
   // services/payroll.service.ts
   import { api } from 'src/boot/axios';
   import { SalaryInformationListResponse } from '@shared/response';
   
   export const PayrollService = {
     getPayrollList(cutoffId: string) {
       return api.get<SalaryInformationListResponse[]>('/api/payroll/processing', {
         params: { cutoffId }
       });
     }
   };
   ```

Following these patterns ensures type safety and consistency across your Vue components and API interactions.