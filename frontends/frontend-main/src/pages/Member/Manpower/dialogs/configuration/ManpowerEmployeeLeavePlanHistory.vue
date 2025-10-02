<template>
  <q-dialog ref="dialog">
    <TemplateDialog minWidth="1200px">
      <template #DialogTitle>
        <div>
          Leave Plan History -
          {{ formatName(employeeLeavePlanTagInformation?.employee.name) }} ({{
            employeeLeavePlanTagInformation?.employee.employeeCode
          }})
        </div>
      </template>
      <template #DialogContent>
        <section class="q-pa-md">
          <div class="row items-center justify-between q-mb-md">
            <GButton
              icon="output"
              label="Export"
              color="gray-8"
              variant="outline"
            />
            <GButton
              v-if="employeeLeavePlanTagInformation?.status.isActive == true"
              @click="
                openAdjustLeaveCreditsDialog(employeeLeavePlanTagInformation)
              "
              color="primary"
              variant="text"
              label="Adjust Credits"
              icon="edit"
            />
          </div>
          <div>
            <g-table
              :apiUrl="`hr-configuration/leave/employee-plan/${employeeLeavePlanTagInformation?.id}/history/table`"
              tableKey="leaveCreditHistory"
              ref="table"
            >
              <template v-slot:transactionType="props">
                <span>
                  {{ formatWord(props.data.transactionType) }}
                </span>
              </template>
            </g-table>
          </div>
        </section>
      </template>
    </TemplateDialog>
    <!-- Adjust Leave Credits Dialog -->
    <ManpowerAdjustLeaveCreditsDialog
      v-model="isAdjustLeaveCreditsDialogOpen"
      :employeeLeavePlanTagInformation="selectedPlan"
      @saveDone="table?.refetch()"
    />
  </q-dialog>
</template>

<style scoped>
.dialog-card {
  min-width: 1100px;
}
</style>

<script lang="ts">
import GTable from "src/components/shared/display/GTable.vue";
import { formatWord } from "src/utility/formatter";
import { formatName } from "src/utility/formatter";
import { ref } from "vue";
import ManpowerAdjustLeaveCreditsDialog from "./ManpowerAdjustLeaveCreditsDialog.vue";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";
import GButton from "src/components/shared/buttons/GButton.vue";

export default {
  name: "EmployeeLeavePlanHistoryDialog",
  components: {
    ManpowerAdjustLeaveCreditsDialog,
    GTable,
    TemplateDialog,
    GButton,
  },
  props: {
    employeeLeavePlanTagInformation: {
      type: [Object, null],
      default: () => ({}),
    },
  },

  setup() {
    const table = ref<{ refetch: () => void } | null>(null);
    const isAdjustLeaveCreditsDialogOpen = ref(false);
    const selectedPlan = ref<object | null>(null);

    const openAdjustLeaveCreditsDialog = (plan: object) => {
      selectedPlan.value = plan;
      isAdjustLeaveCreditsDialogOpen.value = true;
    };

    return {
      table,
      isAdjustLeaveCreditsDialogOpen,
      selectedPlan,
      formatWord,
      formatName,
      openAdjustLeaveCreditsDialog,
    };
  },
};
</script>
