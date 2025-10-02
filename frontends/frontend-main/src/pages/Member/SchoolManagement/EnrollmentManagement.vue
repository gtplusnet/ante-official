<template>
  <expanded-nav-page-container>
    <div class="under-development-container">
      <q-card class="under-development-card">
        <q-card-section class="text-center">
          <q-icon name="o_how_to_reg" size="5rem" color="primary" />
          <h4 class="text-h4 q-mt-md q-mb-xs">Enrollment Management</h4>
          <p class="text-h6 text-grey-7">This feature is under development</p>
          <p class="text-body1 text-grey-6 q-mt-md">
            The Enrollment Management module will handle student registration and enrollment 
            processes. Manage new admissions, returning students, transferees, 
            and track enrollment status across all educational levels.
          </p>
        </q-card-section>
      </q-card>
    </div>
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';

export default defineComponent({
  name: 'EnrollmentManagement',
  components: {
    ExpandedNavPageContainer,
  },
});
</script>

<style scoped>
.under-development-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 20px;
}

.under-development-card {
  max-width: 600px;
  width: 100%;
}
</style>