<template>
  <div class="contract-details-tab">
    <!-- Header Section -->
    <div class="md3-surface">
      <div class="row justify-between items-center">
        <div>
          <h3 class="md3-title-large">
            <q-icon name="description" class="q-mr-sm" color="primary" />
            Employment Contracts
          </h3>
          <div class="md3-body-medium text-grey-7">
            Manage employment contracts and track contract history for this employee.
          </div>
        </div>
        <q-btn 
          unelevated 
          color="primary" 
          icon="add"
          label="New Contract"
          class="md3-button-filled"
          @click="openAddContract"
          no-caps
        />
      </div>
    </div>

    <!-- Contracts Table -->
    <div class="md3-surface">
      <!-- Loading State -->
      <div v-if="isLoading" class="md3-loading-state">
        <q-spinner-dots size="50px" class="md3-spinner" />
        <div class="md3-loading-text">Loading contracts...</div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!tableContract.length" class="md3-empty-state">
        <q-icon name="description" size="64px" class="md3-empty-icon" />
        <div class="md3-empty-title">No contracts found</div>
        <div class="md3-empty-description">
          Start by creating the first employment contract for this employee.
        </div>
        <q-btn 
          unelevated 
          color="primary" 
          label="Create Contract"
          class="md3-button-filled"
          @click="openAddContract"
          no-caps
        />
      </div>

      <!-- Contracts Data -->
      <div v-else>
        <table class="md3-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Monthly Rate</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Employment Type</th>
              <th>Contract File</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="contract in tableContract" :key="contract.id">
              <td class="md3-body-medium">{{ contract.id }}</td>
              <td class="md3-body-medium">{{ contract.monthlyRate.formatCurrency }}</td>
              <td class="md3-body-medium">{{ contract.startDate.dateFull }}</td>
              <td class="md3-body-medium">{{ contract.endDate.dateFull }}</td>
              <td>
                <q-chip 
                  :class="contract.isEmployeeActiveContract ? 'md3-chip-success' : 'md3-chip'"
                  dense
                  size="sm"
                >
                  {{ contract.isEmployeeActiveContract ? 'Active' : 'Inactive' }}
                </q-chip>
              </td>
              <td>
                <q-chip 
                  class="md3-chip-primary"
                  dense
                  size="sm"
                  clickable
                  @click="openEditContract(contract)"
                >
                  {{ contract.employmentStatus.label }}
                </q-chip>
              </td>
              <td class="md3-body-medium">
                <q-btn 
                  v-if="contract.contractFile"
                  flat
                  dense
                  color="primary"
                  :label="contract.contractFile.name"
                  icon="description"
                  size="sm"
                  :href="contract.contractFile.url"
                  target="_blank"
                  class="md3-button-text"
                  no-caps
                />
                <span v-else class="text-grey-6">No file</span>
              </td>
              <td class="md3-body-medium">{{ contract.createdAt.dateFull }}</td>
              <td>
                <div class="row items-center q-gutter-xs">
                  <q-btn 
                    flat
                    round
                    icon="edit"
                    size="sm"
                    color="primary"
                    @click="openEditContract(contract)"
                    class="md3-button-text"
                  >
                    <q-tooltip>Edit Contract</q-tooltip>
                  </q-btn>
                  <q-btn 
                    flat
                    round
                    icon="delete"
                    size="sm"
                    color="negative"
                    @click="setInactiveContract(contract)"
                    class="md3-button-text"
                  >
                    <q-tooltip>Deactivate Contract</q-tooltip>
                  </q-btn>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Contract Dialog -->
    <ContractDialog
      v-model="dialog.open"
      :mode="dialog.mode"
      :contract="dialog.contract"
      :account-id="employeeData?.data?.accountDetails?.id || ''"
      @saved="fetchContracts"
    />
  </div>
</template>

<style scoped lang="scss" src="../EditCreateEmployee.scss"></style>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import ContractDialog from '../ContractDialog.vue';
import { api } from 'src/boot/axios';
import { ContractDataResponse, EmploymentStatusReference } from '@shared/response/contract.response';
import { ContractCreateRequest, ContractEditRequest, EmploymentStatus } from '@shared/request/contract.request';
import { useQuasar } from 'quasar';
import { handleAxiosError } from "../../../../../../../utility/axios.error.handler";

export default defineComponent({
  name: 'ContractDetailsTab',
  components: { ContractDialog },
  props: {
    employeeData: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['cancel'],
  setup(props) {
    const tableContract = ref<ContractDataResponse[]>([]);
    const activeDropdownIndex = ref<number | null>(null);
    const isLoading = ref(false);
    const $q = useQuasar();
    const dialog = ref({ open: false, mode: 'add', contract: null as ContractDataResponse | null });
    const openViewContractDialog = ref(false);

    interface ContractDialogPayload {
      employmentStatus: EmploymentStatusReference;
      startDate: string;
      endDate?: string | null;
      monthlyRate: string | number;
      contractFileId?: string | number;
      mode: 'add' | 'edit';
    }

    onMounted(() => {
      fetchContracts();
    });

    watch(
      () => props.employeeData,
      (val) => {
        if (val?.data?.accountId) fetchContracts();
      },
      { immediate: true, deep: true }
    );

    async function fetchContracts() {
      if (!props.employeeData?.data?.accountDetails?.id) return;

      isLoading.value = true;
      try {
        const res = await api.get('/hris/employee/contract/list', {
          params: { accountId: props.employeeData.data.accountDetails.id },
        });

        tableContract.value = res.data;
      } catch (err) {
        notifyError('Failed to fetch contracts');
      } finally {
        isLoading.value = false;
      }
    }

    function openAddContract() {
      dialog.value = { open: true, mode: 'add', contract: null };
    }
    function openEditContract(contract: ContractDataResponse) {
      dialog.value = { open: true, mode: 'edit', contract };
    }

    function closeDropdown() {
      activeDropdownIndex.value = null;
      document.removeEventListener('click', closeDropdown);
    }
    async function onDialogSave(payload: ContractDialogPayload) {
      if (!props.employeeData?.data?.accountDetails?.id) return;
      isLoading.value = true;
      try {
        if (payload.mode === 'add') {
          const req: ContractCreateRequest = {
            accountId: props.employeeData.accountDetails.id,
            contractData: {
              monthlyRate: Number(payload.monthlyRate),
              employmentStatus: payload.employmentStatus.key as EmploymentStatus,
              startDate: payload.startDate,
              endDate: payload.endDate || null,
              contractFileId: payload.contractFileId ? Number(payload.contractFileId) : undefined,
            },
          };
          await api.post('/hris/employee/contract/add', req);
          notifySuccess('Contract added successfully');
        } else if (payload.mode === 'edit' && dialog.value.contract) {
          const req: ContractEditRequest = {
            contractId: dialog.value.contract.id,
            contractData: {
              monthlyRate: Number(payload.monthlyRate),
              employmentStatus: payload.employmentStatus.key as EmploymentStatus,
              startDate: payload.startDate,
              endDate: payload.endDate || null,
              contractFileId: payload.contractFileId ? Number(payload.contractFileId) : undefined,
            },
          };
          await api.patch('/hris/employee/contract/edit', req);
          notifySuccess('Contract updated successfully');
        }
        dialog.value.open = false;
        fetchContracts();
      } catch (err) {
        notifyError('Failed to save contract');
      } finally {
        isLoading.value = false;
      }
    }
    async function setInactiveContract(contract: ContractDataResponse) {
      $q.dialog({
        title: 'Confirm',
        message: 'Are you sure you want to set this contract as inactive?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        isLoading.value = true;
        $q.loading.show();

        api
          .patch('/hris/employee/contract/inactive', { contractId: contract.id })
          .then(() => {
            fetchContracts();
          })
          .catch((err) => {
            handleAxiosError($q, err);
          })
          .finally(() => {
            $q.loading.hide();
            isLoading.value = false;
          });
      });
    }
    function notifySuccess(msg: string) {
      // @ts-expect-error Quasar $q is injected at runtime
      if (window.$q) window.$q.notify({ type: 'positive', message: msg });
    }
    function notifyError(msg: string) {
      // @ts-expect-error Quasar $q is injected at runtime
      if (window.$q) window.$q.notify({ type: 'negative', message: msg });
    }
    return {
      tableContract,
      activeDropdownIndex,
      isLoading,
      dialog,
      openAddContract,
      openEditContract,
      closeDropdown,
      onDialogSave,
      setInactiveContract,
      openViewContractDialog,
      fetchContracts,
    };
  },
});
</script>
