<template>
  <q-dialog ref="dialog" @before-show="fetchData" persistent>
    <TemplateDialog minWidth="400px">
      <template #DialogTitle> Leave Credits Settings </template>
      <template #DialogContent>
        <q-form @submit.prevent="submitForm" class="q-pa-md">
          <div class="column q-gutter-y-md">
            <div>
              <label class="text-label-large">Initial Leave Credits</label>
              <q-input
                class="text-body-medium"
                required
                v-model="detailsRow.initialLeaveCredits"
                type="number"
                min="0"
                dense
                placeholder="Enter Initial Leave Credits"
                outlined
              />
            </div>

            <div>
              <label class="text-label-large"
                >Total Leave Credits Given Upfront</label
              >
              <q-input
                required
                class="text-body-medium"
                v-model="detailsRow.leaveCreditsGivenUpfront"
                type="number"
                min="0"
                dense
                placeholder="Enter Total Leave Credits Given Upfront"
                outlined
              />
            </div>

            <div>
              <label class="text-label-large"
                >Credits Accrue Over Time (Per month)</label
              >
              <q-input
                class="text-body-medium"
                v-model="detailsRow.monthlyAccrualCredits"
                type="number"
                min="0"
                dense
                placeholder="Enter Credits Accrue Over Time"
                outlined
              />
            </div>

            <div>
              <label class="text-label-large"
                >Number of Days of the Month</label
              >
              <q-input
                class="text-body-medium"
                v-model="detailsRow.numberOfDaysOfMonth"
                type="number"
                min="0"
                dense
                placeholder="Enter Number of Days of the Month"
                outlined
              />
            </div>
          </div>
          <div class="text-right q-mt-md q-gutter-x-sm">
            <GButton
              class="text-label-large"
              variant="outline"
              label="Cancel"
              type="button"
              color="primary"
              v-close-popup
            />
            <GButton
              class="text-label-large"
              label="Save"
              type="submit"
              color="primary"
            />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { ref, computed, watch } from "vue";
import { defineAsyncComponent } from 'vue';
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: "CreateAllowanceDialog",
  components: {
    TemplateDialog,
    GButton,
  },
  props: {
    selectedEmployees: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props, { emit }) {
    const detailsRow = ref({
      initialLeaveCredits: null,
      leaveCreditsGivenUpfront: null,
      monthlyAccrualCredits: null,
      numberOfDaysOfMonth: 22,
    });
    const defaultAllowancePeriod = ref("");
    const updateAllowancePeriod = computed(() => {
      return defaultAllowancePeriod.value;
    });

    watch(
      () => defaultAllowancePeriod.value,
      (newValue) => {
        if (!newValue) {
          defaultAllowancePeriod.value = newValue;
        }
      },
      { immediate: true }
    );

    const submitForm = () => {
      emit("save-allowance-details", {
        LeaveCreditsData: detailsRow.value,
        accountId: props.selectedEmployees,
      });
    };

    const fetchData = () => {
      detailsRow.value = {
        initialLeaveCredits: null,
        leaveCreditsGivenUpfront: null,
        monthlyAccrualCredits: null,
        numberOfDaysOfMonth: 22,
      };
    };

    return {
      updateAllowancePeriod,
      detailsRow,
      fetchData,
      submitForm,
    };
  },
};
</script>
