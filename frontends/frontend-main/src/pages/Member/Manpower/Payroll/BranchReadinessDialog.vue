<template>
  <q-dialog v-model="isOpen" persistent>
    <TemplateDialog minWidth="600px">
      <template #DialogTitle>
        <div>Branch Timekeeping Status</div>
      </template>
      <template #DialogContent>
        <section class="q-pa-md">
          <div v-if="branchStatus" class="q-mb-md">
            <div class="text-subtitle1 q-mb-sm">
              {{ branchStatus.readyBranches }} of {{ branchStatus.totalBranches }} branches ready
            </div>
            <q-linear-progress
              :value="branchStatus.readyBranches / branchStatus.totalBranches"
              color="primary"
              class="q-mb-md"
            />
          </div>

          <q-list separator bordered>
            <q-item v-for="branch in branchStatus?.branches || []" :key="branch.branchId">
              <q-item-section avatar>
                <q-icon
                  :name="branch.isReady ? 'check_circle' : 'radio_button_unchecked'"
                  :color="branch.isReady ? 'positive' : 'grey'"
                  size="sm"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ branch.branchName }}</q-item-label>
                <q-item-label v-if="branch.isReady" caption>
                  Marked ready by {{ branch.markedReadyBy }} on {{ formatDate(branch.markedReadyAt) }}
                </q-item-label>
                <q-item-label v-else caption class="text-grey"> Not yet marked as ready </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-if="!branchStatus || branchStatus.branches.length === 0" class="text-center q-pa-md text-grey">
            No branch data available
          </div>
        </section>
        <section align="right" class="q-mt-sm q-pr-md q-pb-md">
          <GButton variant="tonal" label="Close" color="dark" v-close-popup />
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from "vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import { date } from "quasar";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";

interface BranchStatus {
  totalBranches: number;
  readyBranches: number;
  allReady: boolean;
  branches: Array<{
    branchId: number;
    branchName: string;
    isReady: boolean;
    markedReadyBy: string | null;
    markedReadyAt: string | null;
  }>;
}

export default defineComponent({
  name: "BranchReadinessDialog",
  components: {
    TemplateDialog,
    GButton,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    branchStatus: {
      type: Object as PropType<BranchStatus>,
      default: null,
    },
    cutoffDateRangeId: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const isOpen = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    });

    const formatDate = (dateString: string | null) => {
      if (!dateString) return "";
      return date.formatDate(new Date(dateString), "MMM DD, YYYY h:mm A");
    };

    return {
      isOpen,
      formatDate,
    };
  },
});
</script>
