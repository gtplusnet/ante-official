<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog minWidth="calc(100vw - 80px)">
      <template #DialogTitle> Create Allowance </template>
      <template #DialogContent>
        <form @submit.prevent="save" class="q-pa-md">
          <div class="allowance-table-container q-pb-md">
            <table class="global-table">
              <thead class="text-title-small">
                <tr>
                  <th>Employee Name</th>
                  <th>Allowance Amount</th>
                  <th>Receive Every</th>
                  <th>Effectivity Date</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody class="text-body-medium">
                <tr v-for="(row, index) in allowanceRow" :key="index">
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
                        v-model="row.allowanceAmount"
                        type="number"
                        min="0"
                        dense
                        placeholder="Enter Loan Amount"
                        outlined
                      />
                    </div>
                  </td>
                  <td>
                    <q-select
                      class="input-selection text-body-medium"
                      v-model="row.allowancePeriod"
                      :options="allowancePeriodList"
                      option-value="key"
                      option-label="label"
                      emit-value
                      map-options
                      dense
                      outlined
                    />
                  </td>
                  <td>
                    <g-input
                      class="input-selection text-body-medium"
                      v-model="row.effectivityDate"
                      type="date"
                      dense
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
                <tr v-if="allowanceRow.length === 0">
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
          <div class="row q-pt-md">
            <div class="q-gutter-sm">
              <GButton
                icon="group_add"
                label="Add Employee"
                color="primary"
                class="text-label-large"
                @click="openSelectMultipleDialog"
              />
              <GButton
                variant="outline"
                icon="refresh"
                class="text-label-large"
              />
            </div>
            <q-space />
            <div class="text-right">
              <GButton
                class="q-mr-sm text-label-large"
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
              'hr-configuration/allowance/plan/employee-select?allowanceConfigurationId=' +
              allowanceInformation.id,
          }"
          @add-selected-employees="openAllowanceFormDialog"
        />
        <!-- Allowance Form Dialog -->
        <AllowanceFormDialog
          v-model="isAllowanceFormOpen"
          @save-allowance-details="handleSubmitDetails"
          :selectedEmployees="selectedEmployees"
        />
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style
  src="../../Configuration/Allowance/AllowanceMenuPage.scss"
  scoped
></style>

<script lang="ts">
import GInput from "../../../../../components/shared/form/GInput.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import { onMounted, ref, watch } from "vue";
import { defineAsyncComponent } from 'vue';
import { api } from "src/boot/axios";
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { QDialog, useQuasar } from "quasar";
import { CreateAllowancePlanRequest } from "@shared/request/allowance-plan.request";
import { DeductionPeriod } from "@shared/request";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const SelectMultipleEmployeeDialog = defineAsyncComponent(() =>
  import('./ManpowerSelectMultipleEmployeeDialog.vue')
);
const AllowanceFormDialog = defineAsyncComponent(() =>
  import('src/pages/Member/Manpower/dialogs/configuration/ManpowerAllowanceFormDialog.vue')
);
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

function formatDateForSubmit(date: string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export default {
  name: "CreateAllowanceDialog",
  components: {
    SelectMultipleEmployeeDialog,
    AllowanceFormDialog,
    TemplateDialog,
    GInput,
    GButton,
  },
  props: {
    allowanceInformation: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const isSelectMultipleDialogOpen = ref(false);
    const isAllowanceFormOpen = ref(false);
    const selectedEmployees = ref<string[]>([]);
    const allowancePeriodList = ref([]);
    const selectMultipleEmployee = ref<object | null>(null);
    const allowanceRow = ref<
      Array<{
        employeeId: string;
        employeeName: string;
        allowanceAmount: string;
        allowancePeriod: string;
        effectivityDate: string;
      }>
    >([]);

    interface AllowanceDetails {
      selectedEmployee: Array<{ id: string }>;
      allowanceData: {
        allowanceAmount?: string;
        allowancePeriod?: string;
        effectivityDate?: string;
      };
    }

    watch(
      allowanceRow,
      (newRows) => {
        newRows.forEach((row) => {
          if (row.allowanceAmount)
            row.allowanceAmount = Math.max(
              0,
              Number(row.allowanceAmount)
            ).toString();
          if (!row.allowancePeriod) row.allowancePeriod = "FIRST_PERIOD";
          if (!row.effectivityDate) {
            row.effectivityDate = formatDateForSubmit(
              new Date().toISOString().slice(0, 10)
            );
          }
        });
      },
      { deep: true }
    );

    onMounted(() => {
      fetchAllowancePeriod();
    });

    const fetchAllowancePeriod = () => {
      $q.loading.show();
      api
        .get("hr-configuration/allowance/plan/cutoff-period-type")
        .then((response) => {
          if (response.data) {
            allowancePeriodList.value = (response.data || []).map(
              (item: { label: string; key: string }) => ({
                label: item.label,
                key: item.key,
              })
            );
          }
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    function removeRow(index: number) {
      if (allowanceRow.value.length > 0) {
        allowanceRow.value.splice(index, 1);
      }
    }

    const openAllowanceFormDialog = (employeeIds: string[]) => {
      selectedEmployees.value = employeeIds;
      isAllowanceFormOpen.value = true;
    };

    const handleSubmitDetails = (details: AllowanceDetails) => {
      const existingNames = allowanceRow.value.map((row) => row.employeeName);
      for (const empId of details.selectedEmployee) {
        $q.loading.show();
        api
          .get(`hris/employee/info?accountId=${empId}`)
          .then((response) => {
            if (response.data) {
              const employee = response.data;
              const fullname = employee.accountDetails.fullName;
              const empId = employee.accountDetails.id;

              if (!existingNames.includes(fullname)) {
                allowanceRow.value.push({
                  employeeId: empId,
                  employeeName: fullname,
                  allowanceAmount: details.allowanceData.allowanceAmount || "",
                  allowancePeriod:
                    details.allowanceData.allowancePeriod || "FIRST_PERIOD",
                  effectivityDate:
                    details.allowanceData.effectivityDate ||
                    formatDateForSubmit(new Date().toISOString().slice(0, 10)),
                });
              }
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
      isAllowanceFormOpen.value = false;
    };

    const handleSelectedEmployees = (employeeIds: string[]) => {
      const existingNames = allowanceRow.value.map((row) => row.employeeName);
      for (const id of employeeIds) {
        $q.loading.show();
        api
          .get(`hris/employee/info?accountId=${id}`)
          .then((response) => {
            if (response.data) {
              const employee = response.data;
              const fullname = employee.accountDetails.fullName;
              const empId = employee.accountDetails.id;

              if (!existingNames.includes(fullname)) {
                allowanceRow.value.push({
                  employeeId: empId,
                  employeeName: fullname,
                  allowanceAmount: "",
                  allowancePeriod: "",
                  effectivityDate: "",
                });
              }
            }
          })
          .catch((error) => {
            handleAxiosError($q, error);
          })
          .finally(() => {
            $q.loading.hide();
          });
      }
    };

    const openSelectMultipleDialog = () => {
      isSelectMultipleDialogOpen.value = true;
    };

    const save = async () => {
      $q.loading.show();
      const savePromises = allowanceRow.value.map((row) => {
        const params: CreateAllowancePlanRequest = {
          employeeAccountId: row.employeeId,
          amount: Number(row.allowanceAmount),
          deductionPeriod: row.allowancePeriod as DeductionPeriod,
          effectivityDate: formatDateForSubmit(row.effectivityDate),
          allowanceConfigurationId: props.allowanceInformation.id,
        };
        return api.post("hr-configuration/allowance/plan", params);
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

    const fetchData = () => {
      allowanceRow.value = [];
    };

    return {
      dialog,
      selectMultipleEmployee,
      isSelectMultipleDialogOpen,
      isAllowanceFormOpen,
      selectedEmployees,
      allowanceRow,
      allowancePeriodList,
      removeRow,
      handleSelectedEmployees,
      openSelectMultipleDialog,
      openAllowanceFormDialog,
      save,
      fetchData,
      handleSubmitDetails,
    };
  },
};
</script>
