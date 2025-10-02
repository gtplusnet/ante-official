<template>
  <q-dialog ref="dialog" @before-show="fetchData">
      <TemplateDialog minWidth="calc(100vw - 80px)" no-padding>
        <template #DialogTitle>
          Create Deduction
        </template>
        <template #DialogContent>
        <form @submit.prevent="save">
          <div class="deduction-table-container q-pa-md">
            <table class="global-table">
              <thead class="text-title-small">
                <tr>
                  <th>Employee Name</th>
                  <th>Loan Amount</th>
                  <th>Monthly Amortization</th>
                  <th>Deduction Period</th>
                  <th>Effectivity Date</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in deductionRows" :key="index">
                  <td>
                    <q-input class="input-selection text-body-medium" v-model="row.employeeName" type="text" dense placeholder="Employee Name" outlined />
                  </td>
                  <td>
                    <div v-if="selectedDeduction.category.hasTotalAmount == true">
                      <q-input
                        class="input-selection text-body-medium"
                        v-model="row.loanAmount"
                        type="number"
                        min="0"
                        dense
                        placeholder="Enter Loan Amount"
                        outlined
                      />
                    </div>
                    <div v-else class="text-center">N/A</div>
                  </td>
                  <td>
                    <q-input
                      class="input-selection text-body-medium"
                      v-model="row.monthlyAmortization"
                      type="number"
                      min="0"
                      dense
                      placeholder="Enter Monthly Amortization"
                      outlined
                    />
                  </td>
                  <td>
                    <q-select
                      class="input-selection text-body-medium"
                      v-model="row.deductionPeriod"
                      :options="deductionPeriodList"
                      option-value="key"
                      option-label="label"
                      emit-value
                      map-options
                      dense
                      outlined
                    />
                  </td>
                  <td>
                    <g-input class="input-selection text-body-medium" v-model="row.effectivityDate" type="date" dense outlined />
                  </td>
                  <td class="text-center">
                    <q-icon name="delete" size="24px" color="negative" class="cursor-pointer" @click="removeRow(index)" />
                  </td>
                </tr>
                <tr v-if="deductionRows.length === 0">
                  <td colspan="6" class="text-center text-grey text-label-medium">Add Employee</td>
                </tr>
              </tbody>
            </table>
          </div>
        </form>
          <!-- Select Multiple Employee Deduction -->
          <SelectMultipleEmployeeDialog
            v-model="isSelectMultipleDialogOpen"
            :selectMultipleEmployee="{ url: 'hr-configuration/deduction/plan/employee-select?deductionConfigurationId=' + selectedDeduction.id }"
            @add-selected-employees="openDeductionFormDialog"
          />
          <!-- Deduction Form Dialog -->
          <DeductionFormDialog
            v-model="isDeductionFormOpen"
            @save-deduction-details="handleSubmitDetails"
            :selectedEmployees="selectedEmployees"
            :selectedDeduction="selectedDeduction.category"
          />

        </template>
        <template #DialogMainActions>
          <GButton icon="group_add" label="Add Employee" color="primary" class="text-label-large" @click="openSelectMultipleDialog" />
          <GButton variant="outline" icon="refresh" class="text-label-large" />
        </template>
        <template #DialogSubmitActions>
          <GButton variant="outline" label="Cancel" type="button" v-close-popup />
          <GButton label="Save" type="button" @click="save" />
        </template>
      </TemplateDialog>
  </q-dialog>
</template>

<style src="../../Configuration/Deduction/DeductionMenuPage.scss" scoped></style>

<script lang="ts">
import GInput from "../../../../../components/shared/form/GInput.vue";
import GButton from 'src/components/shared/buttons/GButton.vue';
import { onMounted, ref, watch } from 'vue';
import SelectMultipleEmployeeDialog from './ManpowerSelectMultipleEmployeeDialog.vue';
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { QDialog, useQuasar } from 'quasar';
import { CreateDeductionPlanConfigurationRequest, DeductionPeriod } from "@shared/request";
import DeductionFormDialog from './ManpowerDeductionFormDialog.vue';
import TemplateDialog from "src/components/dialog/TemplateDialog.vue"

function formatDateForSubmit(date: string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default {
  name: 'CreateDeductionDialog',
  components: {
    SelectMultipleEmployeeDialog,
    DeductionFormDialog,
    TemplateDialog,
    GInput,
    GButton,
  },
  props: {
    selectedDeduction: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const isSelectMultipleDialogOpen = ref(false);
    const isDeductionFormOpen = ref(false);
    const selectedEmployees = ref<string[]>([]);
    const deductionPeriodList = ref([]);
    const selectMultipleEmployee = ref<object | null>(null);
    const selectedDeductData = ref(null);
    const deductionRows = ref<
      Array<{
        employeeId: string;
        employeeName: string;
        loanAmount: string;
        monthlyAmortization: string;
        deductionPeriod: string;
        effectivityDate: string;
      }>
    >([
      {
        employeeId: '',
        employeeName: '',
        loanAmount: '',
        monthlyAmortization: '',
        deductionPeriod: '',
        effectivityDate: '',
      },
    ]);

    interface DeductionDetails {
      selectedEmployee: Array<{ id: string }>;
      deductionData: { loanAmount?: string; monthlyAmortization?: string; deductionPeriod?: string; effectivityDate?: string };
    }

    watch(
      deductionRows,
      (newRows) => {
        newRows.forEach((row) => {
          if (row.loanAmount) row.loanAmount = Math.max(0, Number(row.loanAmount)).toString();
          if (row.monthlyAmortization) row.monthlyAmortization = Math.max(0, Number(row.monthlyAmortization)).toString();
          if (!row.deductionPeriod) row.deductionPeriod = 'FIRST_PERIOD';
        });
      },
      { deep: true }
    );

    onMounted(() => {
      fetchDeductionPeriod();
    });

    const fetchDeductionPeriod = () => {
      $q.loading.show();
      api
        .get('hr-configuration/deduction/plan/cutoff-period-type')
        .then((response) => {
          if (response.data) {
            deductionPeriodList.value = (response.data || []).map((item: { label: string; key: string }) => ({
              label: item.label,
              key: item.key,
            }));
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
      if (deductionRows.value.length > 0) {
        deductionRows.value.splice(index, 1);
      }
    }

    const openDeductionFormDialog = (employeeIds: string[]) => {
      selectedEmployees.value = employeeIds;
      isDeductionFormOpen.value = true;
    };

    const handleSubmitDetails = (details: DeductionDetails) => {
      const existingNames = deductionRows.value.map((row) => row.employeeName);
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
                deductionRows.value.push({
                  employeeId: empId,
                  employeeName: fullname,
                  loanAmount: details.deductionData.loanAmount || '',
                  monthlyAmortization: details.deductionData.monthlyAmortization || '',
                  deductionPeriod: details.deductionData.deductionPeriod || 'FIRST_PERIOD',
                  effectivityDate: details.deductionData.effectivityDate || '', // Do not default to today
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
      isDeductionFormOpen.value = false;
    };

    const handleSelectedEmployees = (employeeIds: string[]) => {
      const existingNames = deductionRows.value.map((row) => row.employeeName);
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
                deductionRows.value.push({
                  employeeId: empId,
                  employeeName: fullname,
                  loanAmount: '',
                  monthlyAmortization: '',
                  deductionPeriod: '',
                  effectivityDate: '',
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

      const savePromises = deductionRows.value.map((row) => {
        const params: CreateDeductionPlanConfigurationRequest = {
          employeeAccountId: row.employeeId,
          loanAmount: Number(row.loanAmount),
          monthlyAmortization: parseFloat(row.monthlyAmortization || '0'),
          deductionPeriod: row.deductionPeriod as DeductionPeriod,
          effectivityDate: formatDateForSubmit(row.effectivityDate),
          deductionConfigurationId: props.selectedDeduction.id,
        };

        return api.post('hr-configuration/deduction/plan', params).catch((error) => {
          handleAxiosError($q, error);
        });
      });

      Promise.all(savePromises)
        .then(() => {
          if (dialog.value) {
            dialog.value.hide();
          }
          emit('saveDone');
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const fetchData = () => {
      deductionRows.value = [];
    };

    return {
      dialog,
      selectMultipleEmployee,
      isSelectMultipleDialogOpen,
      isDeductionFormOpen,
      selectedEmployees,
      selectedDeductData,
      deductionRows,
      deductionPeriodList,
      removeRow,
      handleSelectedEmployees,
      openSelectMultipleDialog,
      openDeductionFormDialog,
      save,
      fetchData,
      handleSubmitDetails,
    };
  },
};
</script>
