<template>
  <q-dialog>
    <TemplateDialog maxWidth="800px" scrollable>
      <template #DialogIcon>
        <q-icon name="o_task" size="30px" />
      </template>
      <template #DialogTitle>
        Timekeeping Output
      </template>
      <template #DialogContent>
      <section class="" style="max-height: 80vh;">
        <template v-for="data in outputData?.output" :key="data.date">
          <SimulationOutputDay :data="data"></SimulationOutputDay>
        </template>
      </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style
  scoped
  lang="scss"
  src="./TimeKeepingSimulationOutputDialog.scss"
></style>

<script lang="ts">
import SimulationOutputDay from './SimulationOutput/SimulationOutputDay.vue';
import { defineComponent } from 'vue';
import { defineAsyncComponent } from 'vue';
import { TimeKeepingComputeResponseData } from '@shared/response/timekeeping.response';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default defineComponent({
  name: 'TimeKeepingSimulationOutputDialog',
  components: {
    SimulationOutputDay,
    TemplateDialog,
  },
  props: {
    outputData: {
      type: Object as () => TimeKeepingComputeResponseData,
      required: true,
    },
  },
  setup() {

  },
});
</script>
