<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog minWidth="calc(100vw - 160px)">
      <template #DialogTitle> Create Employee Tag </template>
      <template #DialogContent>
        <form @submit.prevent="save" class="q-pa-md">
          <div
            class="employee-tag-table"
            style="max-height: 600px; overflow-y: auto"
          >
            <table class="global-table">
              <thead class="text-title-small">
                <tr>
                  <th>Employee Name</th>
                  <th>Initial leave credits</th>
                  <th>Total leave credits given upfront</th>
                  <th>Credits accrue over time (Per month)</th>
                  <th>Number of days of the month</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in leaveRow" :key="index">
                  <td>
                    <q-input
                      class="input-selection text-body-medium"
                      v-model="row.employeeName"
                      type="text"
                      dense
                      placeholder="Employee Name"
                      outlined
                    />
                  </td>
                  <td>
                    <div>
                      <q-input
                        class="input-selection text-body-medium"
                        v-model="row.initialLeaveCredits"
                        type="number"
                        min="0"
                        dense
                        placeholder="Enter Loan Amount"
                        outlined
                      />
                    </div>
                  </td>
                  <td>
                    <q-input
                      class="input-selection text-body-medium"
                      v-model="row.totalLeaveCreditsGivenUpfront"
                      type="number"
                      min="0"
                      dense
                      placeholder="Enter Loan Amount"
                      outlined
                    />
                  </td>
                  <td>
                    <q-input
                      class="input-selection text-body-medium"
                      v-model="row.creditsAccrueOverTime"
                      type="number"
                      min="0"
                      dense
                      placeholder="Enter Loan Amount"
                      outlined
                    />
                  </td>
                  <td>
                    <q-input
                      class="input-selection text-body-medium"
                      v-model="row.numberOfDaysOfMonth"
                      type="number"
                      min="0"
                      dense
                      placeholder="Enter Loan Amount"
                      outlined
                    />
                  </td>
                  <td class="text-center">
                    <q-icon
                      name="delete"
                      size="24px"
                      color="negative"
                      class="cursor-pointer"
                      @click="removeRow(index)"
                    />
                  </td>
                </tr>
                <tr v-if="leaveRow.length === 0">
                  <td
                    colspan="6"
                    class="text-center text-grey text-label-medium"
                  >
                    Add Employee
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="row q-mt-md">
            <div class="q-gutter-x-sm">
              <GButton
                class="text-label-large"
                icon="group_add"
                label="Add Employee"
                color="primary"
                @click="openSelectMultipleDialog"
              />
              <GButton
                class="text-label-large"
                variant="outline"
                icon="refresh"
                @click="resetTable"
              />
            </div>
            <q-space />
            <div class="q-gutter-x-sm text-right">
              <GButton
                class="text-label-large"
                variant="outline"
                label="Cancel"
                type="button"
                color="primary"
                v-close-popup
              />
              <GButton
                label="Save"
                type="submit"
                color="primary"
                class="text-label-large"
              />
            </div>
          </div>
        </form>
        <!-- Select Multiple Employee Allowance -->
        <SelectMultipleEmployeeDialog
          v-model="isSelectMultipleDialogOpen"
          :selectMultipleEmployee="{
            url:
              'hr-configuration/leave/plan/employee-select?leavePlanId=' +
              leavePlanInformation?.id,
          }"
          @add-selected-employees="openLeaveCreditsFormDialog"
        />
        <!-- Leave Credits Form Dialog -->
        <LeaveCreditsFormDialog
          v-model="isLeaveCreditsFormOpen"
          @save-allowance-details="handleSubmitDetails"
          :selectedEmployees="selectedEmployees"
        />
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style
  src="../../Configuration/ServiceIncentiveLeave/ServiceIncentiveLeaveMenuPage.scss"
  scoped
></style>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from "vue";
import { defineAsyncComponent } from 'vue';
import { QDialog, useQuasar } from "quasar";
import GButton from "src/components/shared/buttons/GButton.vue";
import type { LeavePlanResponse } from "@shared/response/leave-plan-response.interface";
import {
  AssignEmployeesToPlanRequest,
  EmployeeAssignmentRequest,
} from "@shared/request/leave-configuration.request";
import { api } from "src/boot/axios";
import { handleAxiosError } from "src/utility/axios.error.handler";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const SelectMultipleEmployeeDialog = defineAsyncComponent(() =>
  import('./ManpowerSelectMultipleEmployeeDialog.vue')
);
const LeaveCreditsFormDialog = defineAsyncComponent(() =>
  import('./ManpowerLeaveCreditsFormDialog.vue')
);
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default defineComponent({
  name: "CreateAllowanceDialog",
  components: {
    SelectMultipleEmployeeDialog,
    LeaveCreditsFormDialog,
    TemplateDialog,
    GButton,
  },
  props: {
    leavePlanInformation: {
      type: Object as PropType<LeavePlanResponse | null>,
      default: () => null,
    },
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const isSelectMultipleDialogOpen = ref(false);
    const isLeaveCreditsFormOpen = ref(false);
    const selectedEmployees = ref<string[]>([]);
    const selectMultipleEmployee = ref<object | null>(null);
    const leaveRow = ref<
      Array<{
        employeeId: string;
        employeeName: string;
        initialLeaveCredits: number;
        totalLeaveCreditsGivenUpfront: number;
        creditsAccrueOverTime: number;
        numberOfDaysOfMonth: number;
      }>
    >([]);

    watch(
      leaveRow,
      (newRows) => {
        newRows.forEach((row) => {
          if (row.initialLeaveCredits)
            row.initialLeaveCredits = Math.max(
              0,
              Number(row.initialLeaveCredits)
            );
          if (row.totalLeaveCreditsGivenUpfront)
            row.totalLeaveCreditsGivenUpfront = Math.max(
              0,
              Number(row.totalLeaveCreditsGivenUpfront)
            );
          if (row.creditsAccrueOverTime)
            row.creditsAccrueOverTime = Math.max(
              0,
              Number(row.creditsAccrueOverTime)
            );
          if (row.numberOfDaysOfMonth)
            row.numberOfDaysOfMonth = Math.max(
              0,
              Number(row.numberOfDaysOfMonth)
            );
        });
      },
      { deep: true }
    );

    function removeRow(index: number) {
      if (leaveRow.value.length > 0) {
        leaveRow.value.splice(index, 1);
      }
    }

    const openLeaveCreditsFormDialog = (employeeIds: string[]) => {
      selectedEmployees.value = employeeIds;
      isLeaveCreditsFormOpen.value = true;
    };

    const handleSubmitDetails = (details: EmployeeAssignmentRequest) => {
      for (const empId of details.accountId) {
        $q.loading.show();
        api
          .get(`hris/employee/info?accountId=${empId}`)
          .then((response) => {
            if (response.data) {
              const employee = response.data;
              const fullname = employee.accountDetails.fullName;
              const empId = employee.accountDetails.id;
              const leaveData = details.LeaveCreditsData;

              // Check again in case of race condition
              if (leaveRow.value.some((row) => row.employeeId === empId)) {
                $q.notify({
                  type: "warning",
                  message: `${fullname} is already in the list`,
                  position: "bottom",
                });
                return;
              }

              leaveRow.value.push({
                employeeId: empId,
                employeeName: fullname,
                initialLeaveCredits: leaveData?.initialLeaveCredits || 0,
                totalLeaveCreditsGivenUpfront:
                  leaveData?.leaveCreditsGivenUpfront || 0,
                creditsAccrueOverTime: leaveData?.monthlyAccrualCredits || 0,
                numberOfDaysOfMonth: leaveData?.numberOfDaysOfMonth || 0,
              });
            }
          })
          .catch((error) => {
            handleAxiosError($q, error);
          })
          .finally(() => {
            $q.loading.hide();
          });
      }
      isSelectMultipleDialogOpen.value = false;
      isLeaveCreditsFormOpen.value = false;
    };

    const openSelectMultipleDialog = () => {
      isSelectMultipleDialogOpen.value = true;
    };

    const save = async () => {
      $q.loading.show();
      const savePromises = leaveRow.value.map((row) => {
        const params: AssignEmployeesToPlanRequest = {
          leavePlanId: props.leavePlanInformation?.id,
          employees: [
            {
              accountId: row.employeeId,
              totalAnnualCredits: row.initialLeaveCredits,
              initialLeaveCredits: row.initialLeaveCredits,
              monthlyAccrualCredits: row.creditsAccrueOverTime,
              monthDayCreditsAccrual: row.numberOfDaysOfMonth || 0,
              leaveCreditsGivenUpfront: row.totalLeaveCreditsGivenUpfront,
            },
          ],
        };
        return api.post("hr-configuration/leave/plan/assign", params);
      });

      Promise.all(savePromises)
        .then(() => {
          if (dialog.value) {
            dialog.value.hide();
          }
          emit("saveDone");
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const resetTable = () => {
      $q.dialog({
        title: "Confirm Reset",
        message: "Are you sure you want to clear all employee entries?",
        cancel: true,
        persistent: true,
      }).onOk(() => {
        leaveRow.value = [];
        $q.notify({
          type: "positive",
          message: "Employee list has been reset",
          position: "bottom",
        });
      });
    };

    const fetchData = () => {
      $q.loading.show();
      leaveRow.value = [];
      $q.loading.hide();
    };

    return {
      dialog,
      selectMultipleEmployee,
      isSelectMultipleDialogOpen,
      isLeaveCreditsFormOpen,
      selectedEmployees,
      leaveRow,
      removeRow,
      openSelectMultipleDialog,
      openLeaveCreditsFormDialog,
      save,
      fetchData,
      handleSubmitDetails,
      resetTable,
    };
  },
});
</script>
