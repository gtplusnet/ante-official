---
description: Use if you need to check frontend logged-in account user access token or information
globs: 
alwaysApply: false
---
# Frontend: Checking the Logged-in User

## Overview

To determine which user is currently logged in on the frontend, always use the centralized Pinia store defined in `frontend/src/stores/auth.ts`. This ensures type safety, consistency, and proper reactivity across your application.

-   **User data** is stored in the `accountInformation` state, typed as `AccountDataResponse` from `@shared/response/account.response`.
-   **Authentication status** is available via the `isAuthenticated` getter.
-   **Never** access LocalStorage directly in your components for user data.

---

## How to Access the Logged-in User

### 1. Import and Use the Auth Store

```typescript
import { useAuthStore } from "src/stores/auth";
const authStore = useAuthStore();
```

### 2. Access User Information

```typescript
// Returns the full AccountDataResponse object
type UserType = typeof authStore.accountInformation;
const user = authStore.accountInformation;
```

### 3. Check Authentication Status

```typescript
// Returns true if a user is logged in
const isAuthenticated = authStore.isAuthenticated;
```

### 4. Check Developer Status (if needed)

```typescript
const isDeveloper = authStore.isDeveloper;
```

---

## Example Usage in a Vue Component

```vue
<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "src/stores/auth";

const authStore = useAuthStore();

// Get the logged-in user's name and image
const userName = computed(() => authStore.accountInformation?.name || "Guest");
const userImage = computed(
    () =>
        authStore.accountInformation?.image ||
        "https://cdn.quasar.dev/img/avatar.png"
);

// Check if user is authenticated
const isAuthenticated = computed(() => authStore.isAuthenticated);
</script>

<template>
    <div v-if="isAuthenticated">
        <q-avatar :src="userImage" />
        <span>{{ userName }}</span>
    </div>
    <div v-else>
        <span>Please log in</span>
    </div>
</template>
```

---

## Real Example: `HeaderAccount.vue`

```typescript
const accountImage = computed(() => {
    return (
        authStore.accountInformation?.image ||
        "https://cdn.quasar.dev/img/avatar.png"
    );
});
```

---

## Best Practices

-   **Always** use `useAuthStore()` to access the logged-in user.
-   Use `accountInformation` for user data, and `isAuthenticated` to check login status.
-   **Never** duplicate user state or access LocalStorage directly in components.
-   Use types from `@shared/response/account.response` for type safety.

---

## References

-   [`frontend/src/stores/auth.ts`](../../frontend/src/stores/auth.ts)
-   [`@shared/response/account.response`](../../backend/shared/response/account.response.ts)
