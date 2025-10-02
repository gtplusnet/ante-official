<template>
  <q-layout>
    <q-page-container>
      <div v-if="isLoading" class="loading-container">
        <q-spinner-dots color="primary" size="40px" />
      </div>
      <div v-else class="background-vector">
        <Suspense>
          <template #default>
            <router-view :key="$route.fullPath" />
          </template>
          <template #fallback>
            <div class="flex flex-center q-pa-xl">
              <q-spinner-dots color="primary" size="40px" />
            </div>
          </template>
        </Suspense>
      </div>
    </q-page-container>
  </q-layout>
</template>

<style src="./FrontLayout.scss"></style>

<script lang="ts">
import { ref } from 'vue';

export default {
  name: 'FrontLayout',
  setup() {
    const isLoading = ref(false);
    // Theme is now set globally in boot file - no need to call here

    return {
      isLoading,
    };
  },
};
</script>
