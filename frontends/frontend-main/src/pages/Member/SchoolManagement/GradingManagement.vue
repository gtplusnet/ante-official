<template>
  <expanded-nav-page-container>
    <div class="under-development-container">
      <q-card class="under-development-card">
        <q-card-section class="text-center">
          <q-icon name="o_assignment" size="5rem" color="primary" />
          <h4 class="text-h4 q-mt-md q-mb-xs">Grading Management</h4>
          <p class="text-h6 text-grey-7">This feature is under development</p>
          <p class="text-body1 text-grey-6 q-mt-md">
            The Grading Management module will handle different grading systems 
            from developmental assessments for early childhood to numerical grades 
            for K-12 and GPA calculations for college. Generate report cards and transcripts.
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
  name: 'GradingManagement',
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