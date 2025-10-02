<template>
  <q-dialog>
    <TemplateDialog maxWidth="900px" dialog-min-height="calc(90vh - 50px)">
      <template #DialogIcon>
        <q-icon name="o_star" size="24px" />
      </template>
      <template #DialogTitle>
        <div>Timekeeping Summary</div>
      </template>
      <template #DialogContent>
        <section>
          <SimulationOutputDay :data="selectedOutputData" :employeeAccountId="employeeAccountId">
          </SimulationOutputDay>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { TimekeepingOutputResponse } from "@shared/response";
import SimulationOutputDay from '../TimeKeepingSimulation/SimulationOutput/SimulationOutputDay.vue';
import TemplateDialog from 'src/components/dialog/TemplateDialog.vue';

export default {
  name: 'PayrollTimeKeepingDetailsDialog',
  components: {
    SimulationOutputDay,
    TemplateDialog,
  },
  props: {
    employeeAccountId: {
      type: String,
      required: true,
    },
    cutoffDateRange: {
      type: Object,
      required: true,
    },
    selectedOutputData: {
      type: Object as () => TimekeepingOutputResponse,
      required: true,
    },
  },
  data: () => ({

  }),
};
</script>
