<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Test Schedule Adjustment Display</div>
          </q-card-section>
          <q-card-section>
            <schedule-adjustment-filing-display 
              :filing="testFiling"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ScheduleAdjustmentFilingDisplay from '../components/dialog/FilingApprovalDialog/components/ScheduleAdjustmentFilingDisplay.vue';

export default defineComponent({
  name: 'TestScheduleAdjustment',
  components: {
    ScheduleAdjustmentFilingDisplay
  },
  setup() {
    const testFiling = {
      id: 54,
      filingType: { label: 'Schedule Adjustment' },
      account: { firstName: 'Test', lastName: 'User' },
      accountId: 'test-123',
      date: '2025-06-19',
      status: 'PENDING',
      createdAt: new Date(),
      requestorName: 'Test User',
      shiftId: 87,
      remarks: 'Test filing with shift details'
    };

    return {
      testFiling
    };
  }
});
</script>