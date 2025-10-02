<template>
  <q-dialog ref="dialog" v-model="dialog" persistent>
    <TemplateDialog>
      <template #DialogTitle>
        Assign Employees to Leave Plan
      </template>
      <template #DialogContent>
        <div class="q-gutter-y-md">
          <div class="text-body-medium">
            Plan: <strong>{{ leavePlan?.planName }}</strong>
          </div>

          <div class="text-body-medium">
            Assign {{ selectedEmployees.length }} employee(s) to this leave plan with the following credit settings:
          </div>
        </div>

        <q-form @submit.prevent="saveAssignment" class="q-gutter-md">
          <!-- Credit Configuration -->
          <div class="bg-grey-2 q-pa-md rounded-borders">
            <div class="text-body-medium q-mb-md">Leave Credit Assignment</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="formData.initialCredits"
                  label="Initial Leave Credits"
                  outlined
                  dense
                  type="number"
                  min="0"
                  step="0.5"
                  :rules="[(val) => val >= 0 || 'Must be 0 or greater']"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.effectiveDate"
                  label="Effective Date"
                  outlined
                  dense
                  type="date"
                  :rules="[(val) => !!val || 'Effective date is required']"
                />
              </div>
            </div>
          </div>

          <!-- Selected Employees Preview -->
          <div class="q-mt-md">
            <div class="text-body-medium q-mb-sm">Selected Employees ({{ selectedEmployees.length }})</div>
            <div class="bg-grey-1 q-pa-sm rounded-borders" style="max-height: 200px; overflow-y: auto;">
              <div v-for="emp in selectedEmployees" :key="emp.accountId" class="q-pa-xs">
                <q-chip color="primary" text-color="white" dense class="text-label-large">
                  {{ emp.account.firstName }} {{ emp.account.lastName }}
                  <span class="text-body-medium q-ml-sm">({{ emp.account.email }})</span>
                </q-chip>
              </div>
            </div>
          </div>

          <div class="row q-pt-md q-gutter-sm justify-end">
            <GButton variant="text" label="Cancel" color="primary" v-close-popup />
            <GButton variant="default" label="Assign Employees" type="submit" color="primary" />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { EligibleEmployeeResponse, LeavePlanResponse } from '@shared/response/leave-configuration.response';
import TemplateDialog from 'src/components/dialog/TemplateDialog.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

export default defineComponent({
  name: 'ManpowerEmployeeAssignmentDialog',
  components: {
    TemplateDialog,
    GButton,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    selectedEmployees: {
      type: Array as () => EligibleEmployeeResponse[],
      default: () => [],
    },
    leavePlan: {
      type: Object as () => LeavePlanResponse | null,
      default: null,
    },
  },
  emits: ['update:modelValue', 'save-assignment'],
  setup(props, { emit }) {
    const dialog = ref(false);

    const formData = ref({
      initialCredits: 0,
      effectiveDate: new Date().toISOString().split('T')[0],
    });

    watch(
      () => props.modelValue,
      (val) => {
        dialog.value = val;
        if (val && props.leavePlan) {
          // Pre-populate with plan defaults
          formData.value.initialCredits = Number(props.leavePlan.totalUpfrontCredits) || 0;
        }
      },
    );

    watch(dialog, (val) => {
      emit('update:modelValue', val);
    });

    const saveAssignment = () => {
      const assignmentData = {
        employees: props.selectedEmployees.map((emp) => ({
          accountId: emp.accountId,
          effectiveDate: formData.value.effectiveDate,
          initialCredits: formData.value.initialCredits,
        })),
      };

      emit('save-assignment', assignmentData);
    };

    return {
      dialog,
      formData,
      saveAssignment,
    };
  },
});
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}
</style>
